<template>
  <div id="titlebar">
    <img id="icon" src="../assets/icon.png" />
    <div id="mini-buttons">
      <i
        class="fa-solid fa-minus mini-button minus-button"
        @click="minimizeWindow()"
      ></i>
      <i class="fa-solid fa-x mini-button x-button" @click="hideWindow()"></i>
    </div>
    <div id="actions">
      <button class="action" @click="killProcess()"></button>
    </div>
  </div>
</template>

<script>
import { getCurrentWindow } from '@electron/remote';
import { showNotification } from '../store';

export default {
  name: 'TitleBar',
  methods: {
    minimizeWindow() {
      const window = getCurrentWindow();
      if (window.minimizable) window.minimize();
      else this.hideWindow();
    },
    hideWindow() {
      getCurrentWindow().hide();
    },

    killProcess() {
      this.$store.dispatch('sendMessage', {
        op: 'kill',
        dontSave: true,
      });
      this.$store.state.ws?.close();
      showNotification(
        'Success!',
        'Successfully killed the process',
        'success'
      );
    },
  },
};
</script>

<style scoped>
#titlebar {
  height: 75px;
  width: 100%;
  background-color: var(--color-dark-bg);
  -webkit-app-region: drag;
  display: flex;
  flex-direction: row;
}

#icon {
  width: 55px;
  margin: 10px 15px;
}

#mini-buttons {
  -webkit-app-region: none;
  position: absolute;
  right: 0px;
  top: 0px;
  border-bottom-left-radius: 10px;
}
.mini-button {
  padding: 5px 15px;
  background-color: var(--color-lightest-bg);
  transition: background-color 0.1s ease, color 0.1s ease;
}
.mini-button:hover {
  cursor: pointer;
}
.x-button:hover {
  background-color: var(--color-red);
}
.minus-button {
  border-bottom-left-radius: 10px;
}
.minus-button:hover {
  background-color: var(--color-yellow);
  color: var(--color-lightest-bg);
}

#actions {
  -webkit-app-region: none;
}
</style>
