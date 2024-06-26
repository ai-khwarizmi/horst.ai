<script lang="ts">
	import { cn, removeEdgeByIds } from '@/utils';
	import { edges } from '..';
	import type { Input, Output } from '@/types';
	import { Handle, Position, useConnection, type Connection } from '@xyflow/svelte';
	import { get } from 'svelte/store';
	import { isValidConnection } from '@/utils/validate';

	const HANDLE_WIDTH = 12;
	const ROW_HEIGHT = 30;

	export let nodeId: string;
	export let type: 'input' | 'output';
	export let base: Input<string> | Output<string>;
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
			opacity: ${shouldDimHandle ? 0.3 : 1};
			height: ${ROW_HEIGHT}px;
			width: ${HANDLE_WIDTH}px;
			border-radius: ${HANDLE_WIDTH / 2}px;
		`
		}
	`;
</script>

<div
	style="flex-direction: {type === 'input' ? 'row' : 'row-reverse'};"
	class="handle-container mb-4"
	class:optional-input-hidden={canHideOptionalInput}
>
	<Handle
		type={type === 'input' ? 'target' : 'source'}
		position={type === 'input' ? Position.Left : Position.Right}
		class={cn('handle', connected.length ? '!bg-green-500' : '!bg-gray-500')}
		id={base.id}
		{isValidConnection}
		{onconnect}
		style={`
			position: relative;
			height: ${ROW_HEIGHT}px;
			width: ${HANDLE_WIDTH}px;
			overflow: visible !important;
			${getStyle}
		`}
	/>
	<div
		class={cn(
			'text-ellipsis truncate overflow-hidden w-full',
			type === 'input' ? 'pl-2' : 'pr-2',
			canHideOptionalInput && 'optional-input-hidden'
		)}
		style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px; text-align: {type === 'input'
			? 'left'
			: 'right'};"
	>
		{#if base.label}
			{base.label} ({base.type})
		{:else}
			{base.type}
		{/if}
	</div>
</div>

<style>
	.optional-input-hidden {
		display: none !important;
		visibility: hidden !important;
	}
	.handle-container {
		display: flex;
		align-items: center;
	}
</style>
