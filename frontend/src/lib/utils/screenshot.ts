import { get } from 'svelte/store';
import { state } from '$lib';
import { getNodesBounds, getViewportForBounds } from '@xyflow/svelte';
import { toPng } from 'html-to-image';

const imageWidth = 430;
const imageHeight = 330;

export async function createGraphScreenshot(): Promise<string | null> {
	const nodes = JSON.parse(JSON.stringify(get(get(state).nodes)));

	const nodesBounds = getNodesBounds(nodes);
	const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.001, 100, 0.1);

	const viewportElement = document.querySelector('.svelte-flow__viewport') as HTMLElement;

	if (!viewportElement) {
		console.error('SvelteFlow viewport element not found');
		return null;
	}

	try {
		const dataUrl = await toPng(viewportElement, {
			backgroundColor: 'transparent',
			width: imageWidth,
			height: imageHeight,
			style: {
				width: `${imageWidth}px`,
				height: `${imageHeight}px`,
				transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
			}
		});
		return dataUrl;
	} catch (error) {
		console.error('Error creating screenshot:', error);
		return null;
	}
}
