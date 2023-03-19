<template>
  <div
    id="notification"
    v-bind:class="{
      show: $store.state.notification.showing,
      hide: !$store.state.notification.showing,

      'notification-info': $store.state.notification.data?.type === 'info',
      'notification-success':
        $store.state.notification.data?.type === 'success',
      'notification-fail': $store.state.notification.data?.type === 'fail',
    }"
  >
    <h1 v-html="$store.state.notification.data?.title"></h1>
    <p v-html="$store.state.notification.data?.message"></p>
  </div>
</template>

<script>
export default {
  name: 'Notification',
};
</script>

<style scoped>
#notification {
  width: 400px;
  z-index: 100;
  position: fixed;
  bottom: 20px;
  border-radius: 20px;
  padding: 5px;
}
.show {
  transition: right 0.4s ease;
  right: 20px;
}
.hide {
  transition: right 0.4s ease-in;
  right: -450px;
}

h1 {
  margin: 0px;
  margin-top: 10px;
  margin-left: 10px;
  font-weight: 700;
}
p {
  margin: 0px;
  margin-top: 10px;
  margin-bottom: 15px;
  margin-left: 10px;
  font-weight: 500;
}

.notification-info {
  background-color: var(--color-notif-info);
}
.notification-success {
  background-color: var(--color-notif-success);
}
.notification-fail {
  background-color: var(--color-notif-fail);
}
</style>
