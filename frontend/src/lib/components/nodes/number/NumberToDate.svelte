<script lang="ts">
	import { getInputData, setOutputData } from '@/utils';
	import CustomNode from '../../CustomNode.svelte';

	export let id: string;

	const onExecute = () => {
		const input = getInputData(id, 0);
		setOutputData(id, 0, new Date(input as number).toLocaleString());
	};
</script>

<CustomNode
	label="Number to Date"
	headerType="transform"
	inputs={[{ type: 'number' }]}
	outputs={[{ type: 'text', label: 'Date (Text)' }]}
	{onExecute}
	{...$$props}
/>
