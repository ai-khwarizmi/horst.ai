<template>
	<div class="w-full bg-gray-800 text-white text-xs p-2 flex justify-between items-center">
		<div>Horst.ai</div>
		<div class="flex items-center space-x-2">
			<input :class="{ 'flash-green': flashGreen }" v-model="apiKey" type="text" placeholder="OpenAI API Key"
				class="bg-gray-700 text-white p-1 rounded transition duration-200" />
			<button @click="saveApiKey" class="bg-blue-600 text-white p-1 rounded">Save</button>
		</div>
	</div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';

const apiKey = ref<string>('');
const flashGreen = ref<boolean>(false);

const validateApiKey = (key: string): boolean => {
	const apiKeyRegex = /^sk-[A-Za-z0-9]{48}$/;
	return apiKeyRegex.test(key);
};

const saveApiKey = (): void => {
	if (validateApiKey(apiKey.value)) {
		localStorage.setItem('openai-api-key', apiKey.value);
		flashInputField();
		showCensoredApiKey();
	} else {
		alert('Invalid API Key format.');
	}
};

const flashInputField = (): void => {
	flashGreen.value = true;
	setTimeout(() => {
		flashGreen.value = false;
	}, 2000);
};

const showCensoredApiKey = (): void => {
	const savedKey = localStorage.getItem('openai-api-key');
	if (savedKey) {
		apiKey.value = `${savedKey.slice(0, 6)}...........${savedKey.slice(-4)}`;
	} else {
		apiKey.value = '';
	}
};

onMounted(() => {
	showCensoredApiKey();
});
</script>

<style scoped>
.flash-green {
	background-color: green !important;
}
</style>
