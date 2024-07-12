<script lang="ts">
	import { cn } from '$lib/utils';
	import { websocketStatus } from '$lib/project/cloud';

	const statusConfig = {
		disconnected: { color: 'bg-gray-500', text: 'Offline' },
		error: { color: 'bg-red-500', text: 'Error' },
		connecting: { color: 'bg-orange-500', text: 'Connecting' },
		connected: { color: 'bg-green-500', text: 'Connected' }
	};

	$: currentStatus = statusConfig[$websocketStatus];
</script>

<div class="flex items-center space-x-2 text-sm">
	<div class={cn('w-2 h-2 rounded-full', currentStatus.color)}></div>
	<span>{currentStatus.text}</span>
</div>
