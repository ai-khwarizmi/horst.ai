<script lang="ts">
	import '../app.css';
	import '@xyflow/svelte/dist/style.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import Mobile from '@/components/Mobile.svelte';
	import { attemptClerkInit, clerkLoaded, usesClerk } from '@/auth/Clerk';
	import { onMount } from 'svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { clerk } from '@/auth/Clerk';
	import {
		Workflow,
		Bot,
		CircleHelp,
		CodeXml,
		Book,
		LifeBuoy,
		Settings2,
		SquareUser,
		Mail
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	onMount(() => {
		attemptClerkInit();
	});

	$: path = $page.url.pathname;

	let helpDialogOpen = false;
</script>

<!-- Utils -->
{#if !usesClerk || $clerkLoaded}
	<Toaster />
	<Mobile />

	<div class="grid h-screen w-full pl-14">
		<aside class="inset-y fixed left-0 z-20 flex h-full flex-col border-r w-14">
			<div class="border-b p-2 h-14">
				<Button variant="outline" size="icon" aria-label="Home" href="/">
					<img src="/logo.png" alt="logo" class="w-full h-full" />
				</Button>
			</div>
			<nav class="grid gap-1 p-2">
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<Button
							variant="ghost"
							size="icon"
							class="rounded-lg {path === '/' ? 'bg-muted' : ''}"
							aria-label="Projects"
							builders={[builder]}
							href="/"
						>
							<Workflow class="size-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Projects</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<Button
							variant="ghost"
							size="icon"
							class="rounded-lg {path === '/models/' ? 'bg-muted' : ''}"
							aria-label="Models"
							href="/models/"
							builders={[builder]}
						>
							<Bot class="size-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Models</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<Button
							variant="ghost"
							size="icon"
							class="rounded-lg"
							aria-label="API"
							builders={[builder]}
						>
							<CodeXml class="size-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>API</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<Button
							variant="ghost"
							size="icon"
							class="rounded-lg"
							aria-label="Documentation"
							builders={[builder]}
						>
							<Book class="size-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Documentation</Tooltip.Content>
				</Tooltip.Root>
			</nav>
			<nav class="mt-auto grid gap-1 p-2">
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<Button
							variant="ghost"
							size="icon"
							class="rounded-lg"
							aria-label="Account Settings"
							builders={[builder]}
						>
							<Settings2 class="size-5" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="right" sideOffset={5}>Account Settings</Tooltip.Content>
				</Tooltip.Root>
				<Dialog.Root bind:open={helpDialogOpen}>
					<Dialog.Trigger asChild let:builder={dialogBuilder}>
						<Tooltip.Root>
							<Tooltip.Trigger asChild let:builder>
								<Button
									variant="ghost"
									size="icon"
									class="mt-auto rounded-lg"
									aria-label="Help"
									builders={[builder, dialogBuilder]}
								>
									<LifeBuoy class="size-5" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content side="right" sideOffset={5}>Help</Tooltip.Content>
						</Tooltip.Root>
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Title>Help</Dialog.Title>
						<Dialog.Description>Get help with the app.</Dialog.Description>
						<div class="grid grid-cols-2 gap-2">
							<a
								href="/how-to-use"
								on:click={() => {
									helpDialogOpen = false;
								}}
								class="flex items-center justify-center flex-col gap-2 bg-muted p-4 rounded-lg"
							>
								<div class="flex items-center justify-center w-8 h-8 rounded-full">
									<CircleHelp class="size-6" />
								</div>
								<div class="text-sm text-muted-foreground">Get help with the app.</div>
							</a>
							<a
								href="/contact"
								on:click={() => {
									helpDialogOpen = false;
								}}
								class="flex items-center justify-center flex-col gap-2 bg-muted p-4 rounded-lg"
							>
								<div class="flex items-center justify-center w-8 h-8 rounded-full">
									<Mail class="size-6" />
								</div>
								<div class="text-sm text-muted-foreground">Contact us</div>
							</a>
						</div>
					</Dialog.Content>
				</Dialog.Root>
				{#if usesClerk}
					<Tooltip.Root>
						<Tooltip.Trigger asChild let:builder>
							<Button
								variant="ghost"
								size="icon"
								class="mt-auto rounded-lg"
								aria-label="Account"
								on:click={() => {
									$clerk?.openUserProfile();
								}}
								builders={[builder]}
							>
								<SquareUser class="size-5" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="right" sideOffset={5}>Account</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			</nav>
		</aside>
		<div class="flex flex-col pt-14">
			<slot />
		</div>
	</div>
{:else}
	<!-- LOADER -->
{/if}
