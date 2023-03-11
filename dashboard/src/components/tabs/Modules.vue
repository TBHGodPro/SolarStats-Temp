<template>
  <div id="modules">
    <div id="home-grid">
      <div
        class="box"
        v-for="m in $store.state.data.modules"
        v-bind:key="m.name"
      >
        <h2>{{ m.name }}</h2>
        <h4>{{ m.description }}</h4>
        <button
          class="module-toggle-btn"
          @click="toggleModule(m.name)"
          v-bind:class="{
            'module-toggle-btn-disabled': !m.enabled,
            'module-toggle-btn-enabled': m.enabled,
          }"
        >
          {{ m.enabled ? 'ENABLED' : 'DISABLED' }}
        </button>
      </div>
    </div>
    <div
      ref="tooltip"
      v-show="tooltip.show"
      :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
      class="tooltip"
    >
      <h3 v-html="tooltip.value"></h3>
    </div>
  </div>
</template>

<script>
import { clipboard } from '@electron/remote';

export default {
  name: 'Home',
  data: () => ({
    tooltip: {
      show: false,
      x: 0,
      y: 0,
      value: '',
    },
  }),
  methods: {
    secondsToHms(d) {
      const h = Math.floor(d / 3600);
      const m = Math.floor((d % 3600) / 60);
      const s = Math.floor((d % 3600) % 60);

      const hDisplay = h > 0 ? h + (h == 1 ? ' h ' : ' hrs ') : '';
      const mDisplay = m > 0 ? m + (m == 1 ? ' m ' : ' mins ') : '';
      const sDisplay = s > 0 ? s + (s == 1 ? ' s' : ' s') : '';
      return hDisplay + mDisplay + sDisplay;
    },
    copyToClipboard(data) {
      clipboard.writeText(data, 'clipboard');
    },

    showTooltip(value) {
      this.tooltip.value = value;
      this.tooltip.show = true;
    },
    moveTooltip(event) {
      this.tooltip.x = event.clientX + 20;
      this.tooltip.y = event.clientY - 40;
    },
    hideTooltip() {
      this.tooltip.show = false;
    },

    toggleModule(name) {
      this.$store.state.data.modules.find((i) => i.name == name).enabled =
        !this.$store.state.data.modules.find((i) => i.name == name).enabled;
      this.$store.dispatch('sendMessage', {
        op: 'toggleModule',
        data: {
          name,
          enabled: this.$store.state.data.modules.find((i) => i.name == name)
            .enabled,
        },
      });
    },
  },
};
</script>

<style scoped>
#home-grid {
  margin: 6.5vh 4.75vw;
  width: 85vw;
  height: 75vh;
  padding: calc(2.5vh - 10px) calc(2.5vw - 20px);
  background-color: var(--color-light-bg);
  border-radius: 30px;
  display: grid;
  grid-template-columns: repeat(3, 32.5%);
  grid-template-rows: repeat(2, 250px);
  grid-column-gap: 15px;
  grid-row-gap: 15px;
  justify-content: center;
  overflow-y: scroll;
}

.box {
  background-color: var(--color-lightest-bg);
  width: 95%;
  height: 200px;
  border-radius: 20px;
  transition: background-color 0.15s;
  box-shadow: rgb(0 0 0 / 13%) 0px 1px 5px 0px;
  position: relative;
  align-items: center;
  text-align: center;
  padding: 0px 2.5%;
}

.module-toggle-btn {
  width: 100%;
  height: 50px;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  text-shadow: var(--text-shadow);
  font-size: 15px;
  letter-spacing: 5px;
  font-weight: 600;
  position: absolute;
  bottom: 0;
  cursor: pointer;
  margin-left: -50%;
}
.module-toggle-btn-disabled {
  background-color: var(--color-gray);
  border: none;
  transition: background-color 0.3s;
}
.module-toggle-btn-disabled:hover {
  background-color: var(--color-slightly-light-gray);
}
.module-toggle-btn-enabled {
  background-color: var(--color-green);
  border: none;
  transition: background-color 0.3s;
}
.module-toggle-btn-enabled:hover {
  background-color: var(--color-green-hover);
}
</style>
