import * as remote from '@electron/remote';
import { ipcRenderer } from 'electron';
import { createApp } from 'vue';
import App from './App.vue';
import constants from './constants';
import store, { showNotification } from './store';
import WebSocket from '../node_modules/ws/wrapper.mjs';

import './assets/global.css';

const { events } = constants;

const app = createApp(App).use(store).mount('#app');

ipcRenderer.once('PORT', async (_, port) => {
  const started = Date.now();
  function setup() {
    return new Promise((res, rej) => {
      const ws = new WebSocket(`ws://localhost:${port}`);

      ws.onopen = () => {
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
        store.state.ws = null;
        console.log('[WebSocket] Disconnected');
        setTimeout(() => setup(), 2500);
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
