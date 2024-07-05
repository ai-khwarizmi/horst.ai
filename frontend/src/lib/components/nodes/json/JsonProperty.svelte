<script lang="ts">
	import CustomNode from '$lib/components/CustomNode.svelte';
	import { NodeIOHandler } from '$lib/utils';
	import type { OnExecuteCallbacks } from '$lib/types';

	export let id: string;

	const INPUT_IDS = {
		JSON_INPUT: 'json_input',
		PATH: 'path'
	};

	const OUTPUT_IDS = {
		PARSED_VALUE: 'parsed_value'
	};

	let currentOutput: any;

	const parseJsonPath = (obj: any, path: string) => {
		const parts = path.split(/[.[\]]+/).filter(Boolean);
		let result = obj;
		for (const part of parts) {
			if (result === undefined) break;
			if (Array.isArray(result) && part.startsWith('-')) {
				const index = result.length + parseInt(part);
				result = result[index];
			} else {
				result = result[part];
			}
		}
		return result;
	};

	const onExecute = async (
		callbacks: OnExecuteCallbacks,
		_forceExecute: boolean,
		_wrap: <T>(promise: Promise<T>) => Promise<T>
	) => {
		try {
			const jsonInput = io.getInputData(INPUT_IDS.JSON_INPUT);
			const path = io.getInputData(INPUT_IDS.PATH);

			if (!jsonInput || !path) {
				callbacks.setStatus('idle');
				currentOutput = null;
				io.setOutputData(OUTPUT_IDS.PARSED_VALUE, null);
				return;
			}

			try {
				const jsonObject = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
				const parsedValue = parseJsonPath(jsonObject, path);
				io.setOutputData(OUTPUT_IDS.PARSED_VALUE, parsedValue);
				currentOutput = parsedValue;
				callbacks.setStatus('success');
			} catch (error) {
				callbacks.setErrors(['Error parsing JSON or extracting value', error.message]);
				io.setOutputData(OUTPUT_IDS.PARSED_VALUE, null);
			}
		} catch (error) {
			currentOutput = null;
			console.error('error', error);
			callbacks.setErrors(['Error parsing JSON or extracting value', error.message]);
			io.setOutputData(OUTPUT_IDS.PARSED_VALUE, null);
		}
	};

	const io = new NodeIOHandler({
		nodeId: id,
		inputs: [
			{ id: INPUT_IDS.JSON_INPUT, type: 'text', label: 'JSON Input' },
			{
				id: INPUT_IDS.PATH,
				type: 'text',
				label: 'Path',
				input: {
					inputOptionType: 'input-field',
					default: ''
				}
			}
		],
		outputs: [{ id: OUTPUT_IDS.PARSED_VALUE, type: 'any', label: 'Parsed Value' }],
		onExecute: onExecute,
		isInputUnsupported: async () => {
			return { unsupported: false };
		}
	});
</script>

<CustomNode {io} {onExecute} {...$$props}>
	{#if currentOutput}
		<p>Output:</p>
		<div class="p-4 relative nodrag bg-gray-100">
			<pre>{JSON.stringify(currentOutput, null, 2)}</pre>
		</div>
	{/if}
</CustomNode>
