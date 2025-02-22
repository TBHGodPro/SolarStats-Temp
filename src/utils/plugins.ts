import { StringComponentBuilder } from '@minecraft-js/chat';
import axios from 'axios';
import fetch from 'node-fetch';
import { mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { parse as parseNBT } from 'prismarine-nbt';
import Command from '../Classes/Command';
import Inventory from '../Classes/Inventory';
import Item from '../Classes/Item';
import Logger from '../Classes/Logger';
import { updateMeta } from '../dashboard';
import Player from '../player/Player';
import PlayerModule from '../player/PlayerModule';
import { InventoryType } from '../Types';
import { getConfig, getConfigAsync } from './config';

export async function getPlugins(folder = 'plugins'): Promise<string[]> {
  await stat(folder).catch(async () => await mkdir(folder));

  return await readdir(folder);
}

export default async function loadPlugins(player: Player): Promise<void> {
  const files = await getPlugins();

  for (const file of files) {
    if (!file.endsWith('.js')) continue;

    try {
      const loadedPlugin = loadPlugin(
        player,
        await readFile(join('plugins', file), 'utf8'),
        file
      );
      if (loadedPlugin) {
        player.plugins.push(loadedPlugin);
      }
      updateMeta();
    } catch (error) {
      Logger.error(`Error while loading plugin ${file}`, error);
    }
  }
}

export function loadPlugin(
  player: Player,
  plugin: string,
  file: string
): PluginInfo {
  let info: PluginInfo;

  const Logging: Logger = new Logger(file.substring(0, file.length - 3), true);

  let playerModules: PlayerModule[] = [];

  const context = createContext({
    ...global,
    dirFetch: fetch,
    fetch: (url: string, options: object): Promise<string | object> => {
      return fetch(url, options)
        .then((res) => res.text())
        .then((result) => {
          try {
            result = JSON.parse(result);
          } catch {}

          return result;
        });
    },
    axios,
    console,
    Logger: Logging,
    Buffer,
    __dirname,
    __cwd: process.cwd(),
    __plugins: join(process.cwd(), 'plugins'),
    toolbox: {
      Command,
      PlayerModule,
      Inventory,
      InventoryType,
      Item,
      Message: StringComponentBuilder,
      getConfig: getConfigAsync,
      getConfigSync: getConfig,
      parseNBTData: (
        data: Buffer | string,
        nbtType?: 'big' | 'little' | 'littleVarint'
      ): Promise<{
        parsed: {
          type: 'compound';
          value: any;
        } & {
          name: string;
        };
        type: 'big' | 'little' | 'littleVarint';
        metadata: {
          // The decompressed buffer
          buffer: Buffer;
          // The length of bytes read from the buffer
          size: number;
        };
      }> => {
        if (!Buffer.isBuffer(data)) {
          data = Buffer.from(data, 'base64');
        }
        return parseNBT(data, nbtType);
      },
    },
    player,
    registerPlugin: (plugin: PluginInfo): void => {
      info = plugin;
      Logging.setIdentifier(plugin.name);
    },
    registerCommand: (command: Command): void => {
      player.commandHandler.registerCommand(command.setPlayer(player));
    },
    registerPlayerModule: (playerModule: PlayerModule): void => {
      if (!playerModules) {
        playerModule.createdBy = info;
        player.modules.push(playerModule.setPlayer(player));
      } else playerModules.push(playerModule.setPlayer(player));
    },
    requireModule: (module: string): any => {
      try {
        if (module.startsWith('.')) {
          module = join(process.cwd(), 'plugins', module);
        }
        return require(module);
      } catch (error) {
        // Checks if the error was because the module doesn't exist, in which case it'll return null
        // but if the error was something else it will throw it.
        if (error.code != 'MODULE_NOT_FOUND') {
          throw error;
        }
        return null;
      }
    },
  });

  try {
    runInContext(plugin, context, {
      filename: file,
    });
  } catch (error) {
    return void Logging.error('An error occured while loading Plugin!', error);
  }

  if (isPluginInfo(info)) {
    player.modules.push(
      ...playerModules.map((m) => {
        m.createdBy = info;
        return m;
      })
    );
    playerModules = null;
    return info;
  } else
    Logging.error(
      "This is not a valid Plugin. It doesn't export a valid plugin info. This plugin may work but make sure to call the `registerPlugin` function to register the plugin!"
    );
}

export type PluginInfo = {
  name: string;
  description: string;
  version?: `${number}.${number}.${number}`;
  author?: string;
};

export function isPluginInfo(plugin: any): plugin is PluginInfo {
  return (
    typeof plugin === 'object' &&
    typeof plugin.name === 'string' &&
    typeof plugin.description === 'string'
  );
}
