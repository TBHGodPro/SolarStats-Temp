<template>
  <div id="home-grid">
    <div class="home-grid-row">
      <div class="box box-3">
        <h1>Info</h1>
        <h3>Server: {{ $store.state.data.config.server.host }}</h3>
        <h3>Proxy IP: 127.0.0.1:{{ $store.state.data.config.server.port }}</h3>
        <h2>
          {{ Object.keys($store.state.data.config.modules).length }}
          <small style="font-weight: 600">Modules</small>
        </h2>
        <h2>
          {{ Object.keys($store.state.data.plugins).length }}
          <small style="font-weight: 600">Plugins</small>
        </h2>
        <h2>
          {{ Object.keys($store.state.data.config.customEmotes).length }}
          <small style="font-weight: 600">Custom Emotes</small>
        </h2>
      </div>
      <div class="box box-1">
        <h1>Uptime</h1>
        <h2>{{ uptime }}</h2>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data: () => ({
    uptime: null,
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
  },
  created() {
    this.uptime = this.secondsToHms(
      Math.floor((Date.now() - this.$store.state.data.startedAt) / 1000)
    );
    setInterval(() => {
      this.uptime = this.secondsToHms(
        Math.floor((Date.now() - this.$store.state.data.startedAt) / 1000)
      );
    }, 200);
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
  display: flex;
  flex-direction: row;
}
.home-grid-row {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: 0px 10px;
}

.box {
  padding: 2.5vh 2.5vw;
  border-radius: 30px;
  background-color: var(--color-lightest-bg);
  margin: 10px 0px;
}

.box-1 {
  flex: 1;
}
.box-2 {
  flex: 2;
}
.box-3 {
  flex: 3;
}
</style>
