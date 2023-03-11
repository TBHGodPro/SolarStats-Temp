import * as remote from '@electron/remote';
import { ipcRenderer } from 'electron';
import { createApp } from 'vue';
import App from './App.vue';
import constants from './constants';
import store from './store';

import './assets/global.css';

const { events } = constants;

const app = createApp(App).use(store).mount('#app');

ipcRenderer.once('PORT', async (_, port) => {
  const started = Date.now();
  function setup() {
    return new Promise((res, rej) => {
      store.state.ws = new WebSocket(`ws://localhost:${port}`);

      store.state.ws.onopen = () => {
        store.state.failedPackets.forEach((p) => store.state.ws.send(p));
        store.state.failedPackets = [];
        console.log('[WebSocket] Connected!');
      };
      store.state.ws.onerror = (err) => {
        if (err.target?.readyState !== 3) console.error('[WebSocket]', err);
        rej(err);
      };
      store.state.ws.onclose = () => {
        store.state.ws = null;
        console.log('[WebSocket] Disconnected');
        setTimeout(() => setup(), 2500);
      };
      store.state.ws.onmessage = async ({ data: raw }) => {
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
              setTimeout(res, 1500 - (Date.now() - started))
            );
            store.state.ready = true;
            res();
            break;
          }
          case events.FOCUS_WINDOW:
            remote.getCurrentWindow().show();
            break;
        }
      };
    });
  }
  setup();
});
