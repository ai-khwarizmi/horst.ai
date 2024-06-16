<script lang="ts">
	import { cn, isValidConnection, removeEdgeByIds, type NodeIOHandler } from '@/utils';
	import { edges } from '..';
	import type { Input, Output } from '@/types';
	import { Handle, Position, type Connection } from '@xyflow/svelte';
	import { HANDLE_WIDTH, ROW_HEIGHT } from './CustomNode.svelte';
	import { get } from 'svelte/store';

	export let nodeId: string | undefined = undefined;
	export let type: 'input' | 'output';
	export let base: Input<string> | Output<string>;
	export let top: number;

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
</script>

<Handle
	type={type === 'input' ? 'target' : 'source'}
	position={type === 'input' ? Position.Left : Position.Right}
	class={cn(connected.length && '!bg-green-500', !connected.length && '!bg-gray-500 ')}
	style="{type === 'input'
		? 'left'
		: 'right'}: 1px; top: {top}px; height: {ROW_HEIGHT}px; width: {HANDLE_WIDTH}px; border-radius: {HANDLE_WIDTH /
		2}px;"
	id={base.id}
	{isValidConnection}
	{onconnect}
/>

<div
	class={cn(
		'text-ellipsis truncate overflow-hidden w-full -mt-[1px]',
		type === 'input' && 'pl-2',
		type === 'output' && 'pr-2'
	)}
	style="height: {ROW_HEIGHT}px; line-height: {ROW_HEIGHT}px;"
>
	{connected.map((e) => e.targetHandle)}
	{#if base.label}
		{base.label} ({base.type})
	{:else}
		{base.type}
	{/if}
</div>
