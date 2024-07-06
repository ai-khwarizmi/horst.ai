<script lang="ts">
	export let url: string;
	export let size: number = 20;
	export let className: string = 'mr-2';
	export let style: string = '';

	$: containerStyle = `width: ${size}px; height: ${size}px; display: flex; justify-content: center; align-items: center; ${style}; overflow: hidden`;
</script>

<div class={className} style={containerStyle}>
	<img src={url} alt="Icon" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
</div>
