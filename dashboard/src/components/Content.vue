<template>
  <div id="content">
    <!-- Shows the component corresponding to the current active tab -->
    <component v-bind:is="$store.state.activeTab" />
  </div>
</template>

<script>
import Home from './tabs/Home.vue';

export default {
  name: 'Content',
  components: {
    Home,
  },
};
</script>

<style scoped>
#content {
  margin: -10px 20px;
}
</style>
