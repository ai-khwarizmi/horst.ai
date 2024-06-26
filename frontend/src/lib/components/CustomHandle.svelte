<script lang="ts">
	import { cn, removeEdgeByIds } from '@/utils';
	import { edges } from '..';
	import type { Input, Output } from '@/types';
	import { Handle, Position, useConnection, type Connection } from '@xyflow/svelte';
	import { HANDLE_WIDTH, ROW_HEIGHT } from './CustomNode.svelte';
	import { get } from 'svelte/store';
	import { isValidConnection } from '@/utils/validate';

	export let nodeId: string;
	export let type: 'input' | 'output';
	export let base: Input<string> | Output<string>;
	export let top: number;
	export let topWithoutOptionalNonconnected: number = top;
	export let showOptionalInputs: boolean = true;

	$: outputConnections = $edges.filter((edge) => edge.source === nodeId);
	$: inputConnections = $edges.filter((edge) => edge.target === nodeId);

	$: connections = type === 'output' ? outputConnections : inputConnections;
	$: connected = connections.filter((edge) => {
		if (type === 'output') {
			return edge.sourceHandle === base.id;
		} else {
			return edge.targetHandle === base.id;
		}
	});

	const onconnect = (connections: Connection[]) => {
		const edgesToRemove: string[] = [];
		for (const connection of connections) {
			const conn: Connection & { edgeId?: string } = connection;
			const e = get(edges);
			if (!e) return;
			const edge = e.filter(
				(edge) =>
					edge.target === conn.target &&
					edge.targetHandle === conn.targetHandle &&
					edge.id !== conn.edgeId
			);
			edgesToRemove.push(...edge.map((edge) => edge.id));
		}
		removeEdgeByIds(...edgesToRemove);
	};

	const c = useConnection();

	$: startType = $c.startHandle?.type;

	// Determine if the handle should be hidden based on the connection validity
	// The handle should be hidden if the connection is not valid and the start handle node ID is different from the current node ID
	$: shouldDimHandle =
		$c.startHandle?.handleId &&
		!isValidConnection({
			source: startType === 'source' ? $c.startHandle.nodeId : nodeId,
			sourceHandle: startType === 'source' ? $c.startHandle.handleId : base.id,
			target: startType === 'source' ? nodeId : $c.startHandle.nodeId,
			targetHandle: startType === 'source' ? base.id : $c.startHandle.handleId
		}) &&
		$c.startHandle.nodeId !== nodeId;

	$: canHideOptionalInput = base.optional && !showOptionalInputs && connected.length === 0;

	$: getStyle = `
		${
			canHideOptionalInput
				? `
			display: none !important;
			visibility: hidden !important;
		`
				: `
			${type === 'input' ? 'left' : 'right'}: 1px;
			opacity: ${shouldDimHandle ? 0.3 : 1};
			top: ${!showOptionalInputs && !canHideOptionalInput ? topWithoutOptionalNonconnected : top}px;
			height: ${ROW_HEIGHT}px;
			width: ${HANDLE_WIDTH}px;
			border-radius: ${HANDLE_WIDTH / 2}px;
		`
		}
	`;
</script>

<Handle
	type={type === 'input' ? 'target' : 'source'}
	position={type === 'input' ? Position.Left : Position.Right}
	class={cn(connected.length ? 'bg-green-500' : 'bg-gray-500 ')}
	style={getStyle}
	id={base.id}
	{isValidConnection}
	{onconnect}
/>

<div
	class={cn(
		'text-ellipsis truncate overflow-hidden w-full -mt-[1px]',
		type === 'input' && 'pl-2',
		type === 'output' && 'pr-2',
		canHideOptionalInput && 'optional-input-hidden'
	)}
	style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
>
	{#if base.label}
		{base.label} ({base.type})
	{:else}
		{base.type}
	{/if}
</div>

<style>
	.optional-input-hidden {
		display: none !important;
		visibility: hidden !important;
	}
</style>
