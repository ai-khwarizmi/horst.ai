<script lang="ts">
	export let url: string;
	export let size: number = 20;
	export let className: string = 'mr-2';
</script>

<img class={className} src={url} alt="Icon" width={size} height={size} />
