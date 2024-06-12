<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <StatusBar />
    <div class="flex flex-1 overflow-hidden">
      <Menu v-if="!isMobile" />
      <div v-if="!isMobile" class="flex-1 overflow-auto p-4">
        <LiteGraph />
      </div>
      <div v-else class="flex-1 flex items-center justify-center text-xl">
        This website doesn't work on mobile.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';
import LiteGraph from './components/LiteGraph.vue';
import StatusBar from './components/StatusBar.vue';
import Menu from './components/Menu.vue';

export default defineComponent({
  components: {
    LiteGraph,
    StatusBar,
    Menu,
  },
  computed: {
    isMobile() {
      return window.innerWidth < 900;
    },
  },
});
</script>

<style scoped></style>
