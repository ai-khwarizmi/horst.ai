<template>
	<div ref="graphContainer" class="w-full h-full relative">
		<canvas ref="liteGraphCanvas" class="absolute top-0 left-0"></canvas>
	</div>
</template>

<script lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';  // Import litegraph.css here

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

				const node_const = LiteGraph.createNode("basic/const");
				node_const.pos = [200, 200];
				graph.add(node_const);
				node_const.setValue(4.5);

				const node_watch = LiteGraph.createNode("basic/watch");
				node_watch.pos = [700, 200];
				graph.add(node_watch);
				node_const.connect(0, node_watch, 0);

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
