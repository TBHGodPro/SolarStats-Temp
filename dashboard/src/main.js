import * as remote from '@electron/remote';
import { exec } from 'child_process';
import { ipcRenderer } from 'electron';
import { createApp } from 'vue';
import App from './App.vue';
import constants from './constants';
import { cwd } from './cwd';
import store, { showNotification } from './store';

import './assets/global.css';

const { events } = constants;

const app = createApp(App).use(store).mount('#app');

ipcRenderer.once('PORT', async (_, port) => {
  const started = Date.now();
  let failedAttempts = 0;
  function setup() {
    return new Promise((res, rej) => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.onopen = () => {
        ipcRenderer.send('ConnectionState', true);
        failedAttempts = 0;
        store.state.failedPackets.forEach((p) => ws.send(p));
        store.state.failedPackets = [];
        console.log('[WebSocket] Connected!');
        store.state.ws = ws;
      };
      ws.onerror = (err) => {
        if (err.target?.readyState !== 3) console.error('[WebSocket]', err);
        rej(err);
      };
      ws.onclose = () => {
        ipcRenderer.send('ConnectionState', false);
        failedAttempts += 1;
        store.state.ws = null;
        console.log('[WebSocket] Disconnected');
        setTimeout(() => setup(), 500);
        if (failedAttempts >= 6 && !store.state.ready) {
          failedAttempts = 0;
          console.log(
            '[WebSocket] Failed to connect 6 times, starting process'
          );
          startProcess();
          showNotification(
            'Unable to connect',
            'Failed to connect to SolarStats<br/>Started new SolarStats process',
            'info',
            3500
          );
        }
      };
      ws.onmessage = async ({ data: raw }) => {
        /** @type {{ op: string, data: any }} */
        let msg;
        try {
          msg = JSON.parse(raw);
        } catch {
          return console.error('Invalid Dashboard WS Data', raw);
        }
        const data = msg.data;
        switch (msg.op) {
          case events.METADATA: {
            store.state.data = data;
            await new Promise((res) =>
              setTimeout(res, 1000 - (Date.now() - started))
            );
            store.state.ready = true;
            res();
            break;
          }
          case events.NOTIFICATION:
            showNotification(
              data.title,
              data.message,
              data.type,
              data.duration
            );
            break;
          case events.FOCUS_WINDOW:
            remote.getCurrentWindow().show();
            break;

          case events.UPDATE_CONFIG:
            store.state.data.config = data;
            break;
          case events.UPDATE_MODULES:
            store.state.data.modules = data.modules;
            store.state.data.crashedModules = data.crashedModules;
            store.state.data.settings = data.settings;
            store.state.data.settingsSchemas = data.settingsSchemas;
            break;
          case events.UPDATE_PLUGINS:
            store.state.data.plugins = data;
            break;
          case events.UPDATE_PLAYER:
            store.state.data.player = data;
            break;
        }
      };
    });
  }
  setup();
});

setInterval(
  () => ipcRenderer.send('ConnectionState', store.getters.isConnected),
  500
);

ipcRenderer.on('Action', (_, action) => {
  switch (action) {
    case 'ReloadConfig':
      if (!store.getters.isConnected) return;
      store.dispatch('sendMessage', {
        op: 'reloadConfig',
        dontSave: true,
      });
      break;
    case 'StartProcess':
      if (store.getters.isConnected) return;
      startProcess();
      showNotification('Success!', 'Started SolarStats!', 'success');
      break;
    case 'KillProcess':
      if (!store.getters.isConnected) return;
      store.dispatch('sendMessage', {
        op: 'kill',
        dontSave: true,
      });
      store.state.ws?.close?.();
      showNotification(
        'Success!',
        'Successfully killed the process',
        'success'
      );
      break;
  }
});

export function startProcess() {
  let command = `cd "${cwd}" && `;
  switch (process.platform) {
    case 'darwin':
      command += '/usr/local/bin/node .';
      break;
    case 'win32':
      command += '"C:/Program Files/nodejs/node.exe" .';
      break;
    default:
      command += 'node .';
      break;
  }

  exec(command, (err) => (err ? console.error(err) : null));
}
