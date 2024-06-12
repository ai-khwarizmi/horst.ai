<template>
	<div
		:class="['bg-gray-900 text-white flex-shrink-0', { 'hidden': collapsed, 'w-64': !collapsed, 'w-16': collapsed }]">
		<button @click="collapse" class="p-4 focus:outline-none">
			{{ collapsed ? 'Expand' : 'Collapse' }}
		</button>
		<nav v-if="!collapsed" class="p-4">
			<ul>
				<li class="py-2">Item 1</li>
				<li class="py-2">Item 2</li>
			</ul>
		</nav>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const collapsed = ref(false);

const collapse = () => {
	collapsed.value = !collapsed.value;
};
</script>

<style scoped></style>
