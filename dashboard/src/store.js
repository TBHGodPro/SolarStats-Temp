import { createStore } from 'vuex';

const store = createStore({
  state: {
    activeTab: 'Home',
    ws: null,
    ready: false,
    data: null,
  },
});

export default store;
