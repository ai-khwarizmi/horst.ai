<script lang="ts">
	import Main from '@/components/Main.svelte';
	import { onMount } from 'svelte';

	onMount(() => {});
</script>

<Main />

<div style="position:fixed; bottom:0;left:0;color:red;font-size:8px">
	this should only show up on the home page
</div>
