<template>
  <div id="app-content" v-if="$store.state.ready">
    <Titlebar />
    <Content />
  </div>
  <Loading v-else />
</template>

<script>
import Content from './components/Content.vue';
import Loading from './components/Loading.vue';
import Titlebar from './components/Titlebar.vue';

export default {
  components: { Content, Titlebar, Loading },
  name: 'App',
  async beforeMount() {},
};
</script>
