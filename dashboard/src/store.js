import { createStore } from 'vuex';

const store = createStore({
  state: {
    activeTab: 'Home',
    ws: null,
    ready: false,
    data: null,
    notification: {
      showing: false,
      data: null,
    },
    failedPackets: [],
    showingAddPluginPage: false,
  },
  getters: {
    isConnected(state) {
      return !!state.ws;
    },
  },
  actions: {
    sendMessage(context, raw) {
      let save = true;
      if (raw.dontSave) {
        save = false;
        delete raw.dontSave;
      }
      const data = JSON.stringify(raw);
      if (store.getters.isConnected) store.state.ws.send(data);
      else if (save) store.state.failedPackets.push(data);
    },
  },
});

/**
 * Show a Notification
 * @param {string} title The Notification Title
 * @param {string} message The Notification Message/Body
 * @param {"info" | "success" | "fail"} type The Notification Type
 * @param {number} duration The Length to show the Notification in MS
 */
export async function showNotification(title, message, type, duration = 2500) {
  store.state.notification = {
    showing: true,
    data: {
      title,
      message,
      type,
    },
  };
  await new Promise((res) => setTimeout(res, duration));
  store.state.notification.showing = false;
  store.state.notification.data = null;
}

export default store;
