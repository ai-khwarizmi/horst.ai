<template>
	<div ref="graphContainer" class="w-full h-full relative">
		<canvas ref="liteGraphCanvas" class="absolute top-0 left-0"></canvas>
	</div>
</template>

<script lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { LGraph, LGraphCanvas } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';  // Import litegraph.css here
import * as LZString from 'lz-string';

export default {
	name: 'LiteGraph',
	setup() {
		const graphContainer = ref<HTMLDivElement | null>(null);
		const liteGraphCanvas = ref<HTMLCanvasElement | null>(null);

		let graph: LGraph | null = null;
		let canvas: LGraphCanvas | null = null;

		const setupGraph = () => {
			if (graphContainer.value && liteGraphCanvas.value) {
				const containerWidth = graphContainer.value.offsetWidth;
				const containerHeight = graphContainer.value.offsetHeight;

				// Set canvas size to be 2x the container size
				liteGraphCanvas.value.width = containerWidth * 2;
				liteGraphCanvas.value.height = containerHeight * 2;

				graph = new LGraph();
				canvas = new LGraphCanvas(liteGraphCanvas.value, graph);
				(graph as any).canvas = canvas; // Ensure the graph canvas is set


				const hash = location.hash.substr(1);
				let object = null;
				if (hash) {
					try {
						const raw = atob(hash);
						object = JSON.parse(raw);

						console.log('Parsed hash');
					} catch (err) {
						//expected if encoded
					}
					if (!object) {
						try {
							const compressed = LZString.decompressFromBase64(hash);
							if (compressed) {
								const parsed = JSON.parse(compressed);
								object = parsed;
								console.log('Decompressed hash');
							}
						} catch (err) {
							console.error('Error decompressing hash:', err);
						}
					}
				}
				console.log('object:', object);

				if (object)
					graph.configure(object)


				graph.start();
			}
		};

		const onResize = () => {
			if (graphContainer.value && liteGraphCanvas.value) {
				const containerWidth = graphContainer.value.offsetWidth;
				const containerHeight = graphContainer.value.offsetHeight;

				liteGraphCanvas.value.width = containerWidth * 2;
				liteGraphCanvas.value.height = containerHeight * 2;

				if (canvas) {
					canvas.resize(containerWidth, containerHeight);
				}
			}
		};

		(window as any).saveGraph = () => {
			if (!graph) return;

			const data = graph.serialize();
			const str = JSON.stringify(data, null, 4);
			const blob = new Blob([str], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.download = 'graph.json';
			a.href = url;
			a.click();
		};

		(window as any).shareUrl = () => {
			if (!graph) return;

			const data = graph.serialize();
			const str = JSON.stringify(data);

			//uncompressed base64
			const base64 = btoa(str);

			//compress
			const compressed = LZString.compressToBase64(str);
			console.log('compression ratio:', compressed.length / base64.length);
			console.log('before:', base64.length, ' after:', compressed.length);

			const shorterVersion = compressed.length < base64.length ? compressed : base64;
			//set as hash
			location.hash = shorterVersion;
			if (shorterVersion == compressed)
				console.log('using Compressed');
			else
				console.log('using Uncompressed');

			//copy to clipboard

			navigator.clipboard.writeText(location.href);
		};

		onMounted(() => {
			setupGraph();
			window.addEventListener('resize', onResize);
		});

		onBeforeUnmount(() => {
			window.removeEventListener('resize', onResize);
			if (graph) {
				graph.stop();
			}
		});

		return {
			graphContainer,
			liteGraphCanvas,
		};
	},
};
</script>

<style scoped>
.relative {
	position: relative;
	overflow: hidden;
}
</style>
