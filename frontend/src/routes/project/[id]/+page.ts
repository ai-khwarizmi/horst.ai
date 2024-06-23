import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ params }) => {
	console.log('Load function called'); // Additional log
	console.log('Params:', params); // Debugging log
	const { id: projectId } = params;
	console.log('Loaded projectId:', projectId); // Debugging log
	return {
		projectId
	};
};
