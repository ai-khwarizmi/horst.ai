<script lang="ts">
	import CustomNode from '../CustomNode.svelte';
	import { setOutputData } from '$lib/utils';
	import type { Output } from '@/types';
	import { Input } from '$lib/components/ui/input';

	let value = '';

	const outputs: Output[] = [{ type: 'string', label: 'Text' }];

	export let id: string;

	const onExecute = () => {
		setOutputData(id, 0, value);
	};
</script>

<CustomNode label="Text Input" {outputs} {onExecute} {...$$props}>
	<Input type="text" bind:value />
</CustomNode>
