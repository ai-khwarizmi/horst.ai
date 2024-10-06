<script>
	import Header from '@/components/Header.svelte';
	import ApiKeys from '@/components/settings/APIKeys.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import * as Dialog from '@/components/ui/dialog';
	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Textarea from '@/components/ui/textarea/textarea.svelte';
</script>

<Header>
	<h1 class="text-xl font-semibold">Models</h1>
	<div class="ml-auto flex gap-2">
		<Dialog.Root>
			<Dialog.Trigger let:builder>
				<Button builders={[builder]}>Request a new model</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>Request a new model</Dialog.Title>
				<Dialog.Description>
					Request a new model to be added to the list of available models.
				</Dialog.Description>
				<form class="flex flex-col gap-2">
					<div class="flex flex-col gap-1">
						<Label>Provider</Label>
						<Input placeholder="i.e. OpenAI, Anthropic, etc." />
					</div>
					<div class="flex flex-col gap-1">
						<Label>Model name</Label>
						<Input placeholder="i.e. GPT-4o" />
					</div>
					<div class="flex flex-col gap-1">
						<Label>
							Link
							<span class="text-muted-foreground text-xs">Optional</span>
						</Label>
						<Input placeholder="i.e. https://openai.com/index/hello-gpt-4o/" />
					</div>
					<div class="flex flex-col gap-1">
						<Label>Notes</Label>
						<Textarea placeholder="Any additional information about the model." />
					</div>
					<div class="flex items-center gap-2">
						<Checkbox id="terms" />
						<Label for="terms">I agree to the terms and conditions</Label>
					</div>
					<div class="text-muted-foreground text-sm">
						You can request a new model to be added to the list of available models.
					</div>
					<div class="flex justify-end">
						<Button>Request model</Button>
					</div>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>
</Header>

<div class="h-8"></div>

<div class="mx-auto w-[900px] max-w-full">
	<ApiKeys />
</div>
