<script lang="ts">
	import '../app.css';
	import '@xyflow/svelte/dist/style.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import Mobile from '@/components/Mobile.svelte';
</script>

<Toaster />
<Mobile />
<slot />
