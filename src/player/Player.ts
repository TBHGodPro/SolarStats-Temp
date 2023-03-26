import {
  LunarClientPlayer,
  NotificationLevel
} from '@minecraft-js/lunarbukkitapi';
import { Status } from 'hypixel-api-reborn';
import { Client, ServerClient } from 'minecraft-protocol';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { InstantConnectProxy } from 'prismarine-proxy';
import { config } from '..';
import Command from '../Classes/Command';
import CommandHandler from '../Classes/CommandHandler';
import Listener from '../Classes/Listener';
import Logger from '../Classes/Logger';
import { updateDashboardPlayer, updateMeta } from '../dashboard';
import { Direction, IPlayer, Location, Team } from '../Types';
import { fetchPlayerLocation } from '../utils/hypixel';
import loadPlugins, { PluginInfo } from '../utils/plugins';
import PlayerModule from './PlayerModule';
import PlayerProxyHandler from './PlayerProxyHandler';

export default class Player {
  public readonly crashedModules: PlayerModule[];
  public readonly listener: Listener;
  public readonly plugins: PluginInfo[];
  public readonly proxy: InstantConnectProxy;
  public readonly proxyHandler: PlayerProxyHandler;
  public commandHandler: CommandHandler;
  public modules: PlayerModule[];

  public client?: ServerClient;
  public lastGameMode?: string;
  public lcPlayer?: LunarClientPlayer;
  public online?: boolean;
  public server?: Client;
  public status?: Status;
  public teams?: Team[];
  public connectedPlayers: IPlayer[];
  public uuid?: string;
  public location?: Location;
  public direction?: Direction;

  public get statusMessage(): string {
    return this.status?.online && this.status?.mode && this.status.game?.name
      ? `${
          this.status.mode.includes(this.status.game.name.toUpperCase())
            ? ''
            : `${this.status.game.name} `
        }${
          this.status.mode
            ? `${this.status.mode
                .split('_')
                .filter((i) => this.status.game.name.toUpperCase() != i)
                .map((i) => i[0].toUpperCase() + i.substring(1).toLowerCase())
                .join(' ')}`
            : ''
        }${this.status.map ? ` on ${this.status.map}` : ''}`
      : 'Offline';
  }

  public constructor(proxy: InstantConnectProxy) {
    this.crashedModules = [];
    this.plugins = [];
    this.proxy = proxy;

    this.proxyHandler = new PlayerProxyHandler(this);
    this.listener = new Listener(this.proxyHandler);

    this.listener.setMaxListeners(0);
    this.proxy.setMaxListeners(0);
    this.proxyHandler.setMaxListeners(0);

    const commands: Command[] = [];
    readdirSync(join(__dirname, '..', 'commands')).forEach((file) => {
      try {
        if (!file.endsWith('.js')) return;
        const command = require(join(
          __dirname,
          '..',
          'commands',
          file
        )).default;

        if (command instanceof Command) commands.push(command.setPlayer(this));
        else Logger.warn(`Command in file ${file} is not a command module.`);
      } catch (error) {
        Logger.error(`Couldn't load command ${file}`, error);
      }
    });
    this.commandHandler = new CommandHandler(this.proxyHandler).registerCommand(
      ...commands
    );

    (async () => {
      await loadPlugins(this);

      const modules: PlayerModule[] = [];
      readdirSync(join(__dirname, 'modules')).forEach((file) => {
        try {
          if (!file.endsWith('.js')) return;
          const module = require(join(__dirname, 'modules', file)).default;

          if (module instanceof PlayerModule) {
            config.modules[module.configKey] ??= module.enabled || false;
            modules.push(module.setPlayer(this));
          } else Logger.warn(`Module in file ${file} is not a valid module.`);
        } catch (error) {
          Logger.error(`Couldn't load module ${file}`, error);
        }
      });
      this.modules = modules;
    })();

    this.listener.on('switch_server', async () => {
      this.teams = [];
      this.connectedPlayers = [];
      this.lcPlayer?.removeAllWaypoints();
      this.lcPlayer?.removeAllTeammates();
      await this.refreshPlayerLocation();
    });

    this.listener.on('player_join', (uuid, name) => {
      if (
        uuid === this.uuid ||
        this.connectedPlayers.find((i) => i.uuid === uuid || i.name === name)
      )
        return;
      this.connectedPlayers.push({
        uuid,
        name,
      });
    });

    this.listener.on('player_spawn', (uuid, entityId, location) => {
      const p = this.connectedPlayers.find((v) => v.uuid === uuid);
      if (p) {
        p.entityId = entityId;
        p.location = location;
      }
    });

    this.listener.on('entity_teleport', (entityId, location) => {
      const p = this.connectedPlayers.find((v) => v.entityId === entityId);
      if (p) {
        p.location = location;
      }
    });
    this.listener.on('entity_move', (entityId, difference) => {
      const p = this.connectedPlayers.find((v) => v.entityId === entityId);
      if (p) {
        p.location.x += difference.x;
        p.location.y += difference.y;
        p.location.z += difference.z;
      }
    });

    this.listener.on('player_leave', (entityId) => {
      const p = this.connectedPlayers.findIndex((v) => v.entityId === entityId);
      if (p !== -1) this.connectedPlayers.splice(p, 1);
    });

    this.listener.on('client_move', (location) => (this.location = location));
    this.listener.on(
      'client_face',
      (direction) => (this.direction = direction)
    );

    this.listener.on('team_create', (name) => {
      if (!this.teams.find((team) => team.name === name))
        this.teams.push({
          name,
          players: [],
        });
    });
    this.listener.on('team_delete', (name) => {
      const team = this.teams.find((team) => team.name === name);
      if (team) this.teams.splice(this.teams.indexOf(team), 1);
    });
    this.listener.on('team_player_add', (name, players) => {
      const team = this.teams.find((team) => team.name === name);
      if (team) team.players.push(...players);
      else this.teams.push({ name, players });
    });
  }

  public connect(client: ServerClient, server: Client): void {
    this.client = client;
    this.online = true;
    this.server = server;
    this.teams = [];
    this.connectedPlayers = [];
    this.uuid = client.uuid;

    this.lcPlayer = new LunarClientPlayer({
      playerUUID: this.uuid,
      customHandling: {
        registerPluginChannel: (channel) => {
          this.client.write('custom_payload', {
            channel: 'REGISTER',
            data: Buffer.from(channel + '\0'),
          });
        },
        sendPacket: (buffer) => {
          this.client.write('custom_payload', {
            channel: this.lcPlayer.channel,
            data: buffer,
          });
        },
      },
    });
    this.lcPlayer.connect();

    this.refreshPlayerLocation();
    // In case the user reconnects to the server and is directly in a game
    setTimeout(async () => {
      await this.refreshPlayerLocation();
    }, 1500);

    updateDashboardPlayer();
  }

  public disconnect(): void {
    this.client = null;
    this.lastGameMode = null;
    this.lcPlayer = null;
    this.online = false;
    this.status = null;
    this.teams = [];
    this.uuid = null;

    this.listener.removeAllListeners();

    this.modules.forEach((module) => module.onDisconnect());

    updateDashboardPlayer();
  }

  public async refreshPlayerLocation(): Promise<void> {
    await fetchPlayerLocation(this.uuid)
      .then((status) => {
        this.status = status;
        if (this.status.mode !== 'LOBBY') this.lastGameMode = this.status.mode;
      })
      .catch(() => {
        this.status = null;
      });

    updateDashboardPlayer();
  }

  public async dodge(): Promise<void> {
    if (!this.status) return;
    if (!this.status.mode) return;
    if (this.status.mode === 'LOBBY') return;
    this.lcPlayer.sendNotification(
      'Dodging game...',
      2500,
      NotificationLevel.INFO
    );
    const command = `/play ${this.status.mode.toLocaleLowerCase()}`;
    this.executeCommand('/lobby blitz');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    this.executeCommand(command);

    let switched = false;
    this.listener.once('switch_server', () => {
      switched = true;
    });

    setTimeout(() => {
      if (switched) return;

      this.executeCommand(command);
    }, 2500);
  }

  public isInGameMode(gamemode: string): boolean {
    if (this.status)
      return (
        this.status.mode?.toUpperCase().includes(gamemode.toUpperCase()) ||
        this.status.game?.name?.toUpperCase().includes(gamemode.toUpperCase())
      );
    else return false;
  }

  public sendMessage(text: string): void {
    this.client.write('chat', { message: JSON.stringify({ text }) });
  }

  public executeCommand(command: string): void {
    this.server.write('chat', { message: command });
  }

  private onModuleCrash(module: PlayerModule, error): void {
    this.sendMessage(
      `§cError while executing module ${module.name}!\n§cDisabling module...`
    );
    this.modules.splice(this.modules.indexOf(module), 1);
    Logger.error(`Error while executing module ${module.name}!`, error);
    this.crashedModules.push(module);

    updateMeta();
  }
}
