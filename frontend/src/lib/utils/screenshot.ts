import { get } from 'svelte/store';
import { state } from '$lib';
import { getNodesBounds, getViewportForBounds } from '@xyflow/svelte';
import { toPng } from 'html-to-image';

const imageWidth = 1024;
const imageHeight = 768;

function downloadImage(dataUrl: string) {
	const a = document.createElement('a');
	a.setAttribute('download', 'svelteflow.png');
	a.setAttribute('href', dataUrl);
	a.click();
}

export function createGraphScreenshot() {
	const nodes = get(get(state).nodes);

	const nodesBounds = getNodesBounds(nodes);
	const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 10);

	const viewportElement = document.querySelector('.svelte-flow__viewport') as HTMLElement;

	if (!viewportElement) {
		console.error('SvelteFlow viewport element not found');
		return;
	}

	toPng(viewportElement, {
		backgroundColor: '#ffffff',
		width: imageWidth,
		height: imageHeight,
		style: {
			width: `${imageWidth}px`,
			height: `${imageHeight}px`,
			transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
		}
	})
		.then(downloadImage)
		.catch((error: any) => {
			console.error('Error creating screenshot:', error);
		});
}
