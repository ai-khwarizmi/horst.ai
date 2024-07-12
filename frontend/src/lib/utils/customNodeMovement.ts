import { get } from 'svelte/store';
import { nodes } from '..';

export const NODE_MOVEMENTS_SERVER_UPDATE_INTERVAL = 50;
const LERP_STEPS = 10;
const MS_PER_STEP = NODE_MOVEMENTS_SERVER_UPDATE_INTERVAL / LERP_STEPS;

const nodeMoveResizedLerpIntervals: any = {};
const nodeMoveResizedLerpData = new Map<
	string,
	{
		startPosition: { x: number; y: number };
		startSize: { width: number; height: number };
		targetPosition: { x: number; y: number };
		targetSize: { width: number; height: number };
		step: number;
	}
>();

function lerp(start: { x: number; y: number }, end: { x: number; y: number }, t: number) {
	return {
		x: start.x + (end.x - start.x) * t,
		y: start.y + (end.y - start.y) * t
	};
}

function processNodeMovedResized(nodeId: string) {
	const data = nodeMoveResizedLerpData.get(nodeId);
	if (!data) {
		clearInterval(nodeMoveResizedLerpIntervals[nodeId]);
		delete nodeMoveResizedLerpIntervals[nodeId];
		return;
	}
	data.step++;
	let lerpPosition = lerp(data.startPosition, data.targetPosition, data.step / LERP_STEPS);
	let lerpSize = lerp(
		{
			x: data.startSize.width,
			y: data.startSize.height
		},
		{
			x: data.targetSize.width,
			y: data.targetSize.height
		},
		data.step / LERP_STEPS
	);

	if (data.step >= LERP_STEPS) {
		lerpPosition = data.targetPosition;
		lerpSize = {
			x: data.targetSize.width,
			y: data.targetSize.height
		};
	}
	nodes.update((currentNodes) => {
		const nodeIndex = currentNodes.findIndex((node) => node.id === nodeId);
		if (nodeIndex !== -1) {
			currentNodes[nodeIndex].position = lerpPosition;
			currentNodes[nodeIndex].width = lerpSize.x;
			currentNodes[nodeIndex].height = lerpSize.y;
		}

		if (data.step > LERP_STEPS) {
			clearInterval(nodeMoveResizedLerpIntervals[nodeId]);
			delete nodeMoveResizedLerpIntervals[nodeId];
		}

		return currentNodes;
	});
}

export function moveAndResizeNode(data: {
	nodeId: string;
	position: { x: number; y: number };
	size: { width: number; height: number };
	nonce: number;
}) {
	const node = get(nodes).find((node) => node.id === data.nodeId);
	if (!node) {
		return;
	}
	const newNodeMoveResizedData = {
		startPosition: node.position,
		startSize: { width: node.width, height: node.height },
		targetPosition: data.position,
		targetSize: data.size
	};
	if (data.position) {
		newNodeMoveResizedData.targetPosition = data.position;
	}
	if (data.size) {
		newNodeMoveResizedData.targetSize = data.size;
	}

	nodeMoveResizedLerpData.set(data.nodeId, {
		startPosition: newNodeMoveResizedData.startPosition,
		startSize: {
			width: newNodeMoveResizedData.startSize.width!,
			height: newNodeMoveResizedData.startSize.height!
		},
		targetPosition: newNodeMoveResizedData.targetPosition!,
		targetSize: newNodeMoveResizedData.targetSize!,
		step: 0
	});

	if (!nodeMoveResizedLerpIntervals[data.nodeId]) {
		nodeMoveResizedLerpIntervals[data.nodeId] = setInterval(() => {
			processNodeMovedResized(data.nodeId);
		}, MS_PER_STEP);
	}
}
