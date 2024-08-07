import { fullSuperJSON } from '@/utils/horstfile';
import { getSaveData, loadFromGraph } from '.';
import { toast } from 'svelte-sonner';
import type { SaveFileFormat } from '@/types';

export const loadGraphFromUploadedFile = async () => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.onchange = async (e) => {
		const target = e.target as HTMLInputElement;
		if (!target.files) return alert('no file selected');
		const file = target.files[0];
		if (!file) {
			throw new Error('No file selected');
		}
		await loadFromFile(file);
		toast.success('Project loaded');
	};
	input.click();
};

export const loadFromFile = async (file: File) => {
	const text = await file.text();
	console.log('loadFromFile', text);
	const graph = fullSuperJSON.parse<SaveFileFormat>(text);
	return loadFromGraph(graph);
};

export const saveGraphToJson = () => {
	const graph = getSaveData(true, true);

	const name = graph.graph.projectName || 'graph';
	const filename = name
		.replace(/[^a-z0-9]/gi, '_')
		.toLowerCase()
		.replaceAll('__', '_');

	const blob = new Blob([graph.stringifiedGraph], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.download = filename + '.horst.json';
	a.href = url;
	a.click();
};
