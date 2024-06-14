<script lang="ts">
	import CustomNode from '../CustomNode.svelte';
	import { getInputData } from '$lib/utils';

	export let id: string;
	let data: any;

	function onExecute() {
		data = getInputData(id, 0);
	}
</script>

<CustomNode label="Text Display" inputs={[{ type: 'any', label: 'Text' }]} {onExecute} {...$$props}>
	{data ?? ''}
</CustomNode>
