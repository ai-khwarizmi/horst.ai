<script lang="ts">
	import { getInputData, setOutputData } from '@/utils';
	import CustomNode from '../../CustomNode.svelte';

	export let id: string;

	const onExecute = () => {
		const input = getInputData(id, 0);
		setOutputData(id, 0, String(input));
	};
</script>

<CustomNode
	label="Number to Text"
	headerType="transform"
	inputs={[{ type: 'number' }]}
	outputs={[{ type: 'text' }]}
	{onExecute}
	{...$$props}
/>
