import axios from 'axios';
import * as chalk from 'chalk';
import { Client, ping } from 'minecraft-protocol';
import { readFileSync, writeFileSync } from 'node:fs';
import * as https from 'node:https';
import { join } from 'node:path';
import { InstantConnectProxy } from 'prismarine-proxy';
import { NIL } from 'uuid';
import Logger from './Classes/Logger';
import BossBar from './Classes/PlayerControllers/BossBar';
import { Config, reloadEmotes } from './Types';
import initDashboard, { updateConfig } from './dashboard';
import Player from './player/Player';
import { filePath, getConfig } from './utils/config';
import { createClient } from './utils/hypixel';
import setupTray from './utils/systray';
import update from './utils/updater';

export const isPacked: boolean = Object.prototype.hasOwnProperty.call(
  process,
  'pkg'
);
export const version = JSON.parse(
  readFileSync(
    isPacked ? join(__dirname, '..', 'package.json') : 'package.json',
    'utf8'
  )
).version;
export let config = getConfig();
if (
  !/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(
    config.apiKey
  )
)
  throw 'Please put in a valid Hypixel API Key into the config.json file';
export const hypixelClient = createClient(config.apiKey);
export const dashboard = initDashboard();

export function reloadConfig(data: Config, log = true) {
  if (JSON.stringify(config) == JSON.stringify(data)) return;
  config = data;
  reloadEmotes();
  if (log) {
    Logger.info('Config Reloaded');
    dashboard.emit('notification', {
      title: 'Reloaded Config!',
      message: '',
      type: 'info',
    });
  }
  updateConfig();
}

console.log(`\n   _____       _               _____ _        _       
  / ____|     | |             / ____| |      | |      
 | (___   ___ | | __ _ _ __  | (___ | |_ __ _| |_ ___ 
  \\___ \\ / _ \\| |/ _\` | '__|  \\___ \\| __/ _\` | __/ __|
  ____) | (_) | | (_| | |     ____) | || (_| | |_\\__ \\
 |_____/ \\___/|_|\\__,_|_|    |_____/ \\__\\__,_|\\__|___/`);
let versionString = '';
for (let i = 0; i < 52 - version.length; i++) versionString += ' ';
console.log(`${versionString}v${version}\n`);

if (
  process.platform === 'win32' &&
  config.checkForUpdates &&
  !process.argv.includes('--skipUpdater')
)
  update();

export let toClient: Client;
const proxy = new InstantConnectProxy({
  loginHandler: (client) => {
    toClient = client;
    return {
      auth: 'microsoft',
      username: client.username,
    };
  },

  serverOptions: {
    version: '1.8.9',
    motd: '§cSolar Stats Proxy',
    port: config.proxyPort,
    beforePing: async (response, client, callback) => {
      response = await ping({
        host: config.server.host,
        port: config.server.port,
        version: client.version,
      });
      response.players.sample = [{ name: '§cSolar Stats Proxy', id: NIL }];

      callback(null, response);
    },
    validateChannelProtocol: false,
  },

  clientOptions: {
    version: '1.8.9',
    host: config.server.host,
    port: config.server.port,
    validateChannelProtocol: false,
  },
});
Logger.info('Proxy started');

writeFileSync(filePath, JSON.stringify(config, null, 2));

export const player = new Player(proxy);

import './ErrorCatcher';

// Triggered when the player connects
// AND changes server (when connected to a proxy like Bungeecord) for some reason
player.proxyHandler.on('start', (client, server) => {
  if (!player.online) {
    toClient = client as Client;
    Logger.info(`${chalk.italic.bold(client.username)} connected to the proxy`);
    player.connect(client, server);
  }
});

player.proxyHandler.on('end', (username, log) => {
  toClient = null;
  if (log && player.online)
    Logger.info(`${chalk.italic.bold(username)} disconnected from the proxy`);
  player.disconnect();
});

if (!config.dashboard.enabled || process.platform !== 'darwin') setupTray();

// Statistics
if (config.statistics && !process.argv.includes('--noTracking'))
  axios
    .post(
      'https://server.solartweaks.com/api/launch',
      {
        item: 'solarstats',
      },
      {
        // Safe because not transmitting sensitive data
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    )
    .catch((error) =>
      Logger.error('An error occurred while sending statistics', error)
    );

export const bossBar = new BossBar('§cSolar§fStats', 300);
bossBar.render();

export function updateMainBossBar() {
  const name = `§cSolar§fStats | ${player.statusMessage}`;

  if (bossBar.text != name) bossBar.setText(name);
}
setInterval(() => updateMainBossBar(), 500);

// import './Classes/PlayerControllers/SideBar';
