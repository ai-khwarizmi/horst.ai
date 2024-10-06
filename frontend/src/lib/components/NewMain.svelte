<script lang="ts">
	import {
		SvelteFlow,
		Background,
		Panel,
		type OnConnectStart,
		type Connection
	} from '@xyflow/svelte';

	import '@xyflow/svelte/dist/style.css';
	import { commandOpen, createNodeParams, gridSnap, recentProjectsOpen, state } from '$lib';
	import BottomBar from '@/components/BottomBar.svelte';
	import FullCommand from '@/components/FullCommand.svelte';
	import { onMount } from 'svelte';
	import Button from '@/components/ui/button/button.svelte';
	import FileDropper from '@/components/file/FileDropper.svelte';
	import { isMobile } from '@/components/Mobile.svelte';
	import NewFilePopup from '@/components/popups/NewFilePopup.svelte';

	import PackageJson from '../../../package.json';
	import DebugView from '@/components/DebugView.svelte';
	import type { ConnectWith } from '@/types';
	import ProjectSettings from '@/components/ProjectSettings.svelte';
	import SaveFilePopup from './popups/SaveFilePopup.svelte';
	import OpenFilePopup from './popups/OpenFilePopup.svelte';
	import VersionChangePopup from './popups/VersionChangePopup.svelte';
	import CustomEdge from './CustomEdge.svelte';
	import { createNewProject, loadCloudProject, loadLocalProject } from '@/project';
	import { get, writable } from 'svelte/store';
	import { session } from '@/auth/Clerk';
	import ContextMenu from './ContextMenu.svelte';
	import { saveAsCloudProject, sendNodeMoveResize, takeAndUploadScreenshot } from '@/project/cloud';
	import { resetLocalProject } from '@/project/local';
	import HotkeysPopup from './popups/HotkeysPopup.svelte';
	import WebsocketStatus from './WebsocketStatus.svelte';
	import PlayPause from './PlayPause.svelte';
	import WelcomePopup from './popups/WelcomePopup.svelte';
	import ShareGraph from './file/ShareGraph.svelte';
	import NewNode from './nodes/NewNode.svelte';
	import Label from './ui/label/label.svelte';
	import Input from './ui/input/input.svelte';
	import Textarea from './ui/textarea/textarea.svelte';
	import Separator from './ui/separator/separator.svelte';
	import * as Select from './ui/select';
	import { Link } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	export let projectId: string | undefined = undefined;

	onMount(async () => {
		if (projectId) {
			console.log('[MAIN onMount] loading cloud project', projectId);
			await loadCloudProject(projectId);
			return;
		}

		const result = loadLocalProject();
		const userLoggedIn = !!get(session);

		if (userLoggedIn) {
			await handleLoggedInUser(result);
		} else {
			handleNonLoggedInUser(result);
		}
	});

	async function handleLoggedInUser(localProjectLoaded: boolean) {
		if (!localProjectLoaded) {
			console.log('[MAIN onMount] no local project found. User logged in, showing recents');
			recentProjectsOpen.set(true);
			return;
		}

		if ($nodes.length > 0) {
			console.log('[MAIN onMount] saving local project to cloud');
			await saveAsCloudProject(true);
			await takeAndUploadScreenshot();
		} else {
			console.log('[MAIN onMount] local project empty, showing recents');
			resetLocalProject();
			recentProjectsOpen.set(true);
		}
	}

	function handleNonLoggedInUser(localProjectLoaded: boolean) {
		if (localProjectLoaded) {
			console.log('[MAIN onMount] loading local project');
		} else {
			console.log('[MAIN onMount] no local project found. Creating new project');
			createNewProject();
		}
	}

	let startNode: ConnectWith | null = null;
	const handleConnectionStart: OnConnectStart = (e, { nodeId, handleId, handleType }) => {
		if (nodeId && handleId) {
			startNode = {
				id: nodeId,
				handle: handleId,
				type: handleType === 'source' ? 'output' : 'input'
			};
		}
	};

	const handleConnect = (_connection: Connection) => {
		startNode = null;
	};

	const handleConnectionEnd = (e: MouseEvent | TouchEvent) => {
		if (!startNode) return;
		if ((e.target as Element)?.classList?.contains?.('svelte-flow__pane')) {
			commandOpen.set(true);
			const position =
				e instanceof MouseEvent
					? { x: e.clientX, y: e.clientY }
					: { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
			createNodeParams.set({
				position,
				node: startNode ?? undefined
			});
		}
	};

	const handleNodeDrag = (e: CustomEvent) => {
		const nodeId = e.detail.nodes[0]?.id;
		if (nodeId) {
			sendNodeMoveResize(nodeId);
		}
	};

	const edgeTypes = {
		custom: CustomEdge
	};

	const nodes = writable<any[]>([
		{
			id: '1',
			type: 'test',
			data: {
				label: 'New Node'
			},
			position: {
				x: 250,
				y: 250
			}
		},
		{
			id: '2',
			type: 'test',
			data: {
				label: 'New Node'
			},
			position: {
				x: 650,
				y: 250
			}
		}
	]);
	const edges = writable<any[]>([]);

	const nodeTypes: Record<string, any> = {
		test: NewNode
	};

	$: selectedNodes = $nodes.filter((node) => node.selected);
	$: firstSelectedNode = selectedNodes[0];
</script>

<main class="flex h-full">
	<FileDropper />
	<ProjectSettings />
	<NewFilePopup />
	<VersionChangePopup />
	<OpenFilePopup />
	<SaveFilePopup />
	<ContextMenu />
	<WelcomePopup />
	<ShareGraph />
	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		{edgeTypes}
		viewport={$state.viewport}
		minZoom={0.25}
		deleteKey={['Delete', 'Backspace']}
		snapGrid={$gridSnap}
		onconnect={handleConnect}
		onconnectstart={handleConnectionStart}
		onconnectend={handleConnectionEnd}
		on:nodedrag={handleNodeDrag}
		defaultEdgeOptions={{
			type: 'custom'
		}}
	>
		<HotkeysPopup />
		<DebugView />
		<FullCommand />
		<Background />
		<Panel position="bottom-left">
			<WebsocketStatus />
		</Panel>
		<Panel position="top-center">
			<PlayPause />
		</Panel>
		<Panel position="bottom-center">
			<BottomBar />
		</Panel>
		<Panel position="bottom-right" style="display: flex; align-items: center; gap: 5px;">
			{#if !$isMobile}
				<Button
					variant="link"
					target="_blank"
					class="text-xs"
					href={PackageJson.repository.url}
					style="display: flex; align-items: center;"
				>
					<img
						src="/github-mark.png"
						alt="Github"
						style="margin-right: 10px; width: 1.5rem; height: 1.5rem;"
					/>
					Github (v{PackageJson.version})
				</Button>
				<Button variant="link" class="text-xs" target="_blank" href="/credits">Credits</Button>
			{/if}
			<Button variant="link" class="text-xs" target="_blank" href="/terms">
				{#if !$isMobile}
					Terms of Use
				{:else}
					Terms
				{/if}
			</Button>
		</Panel>
		<Panel position="top-right" class="h-full" style="margin: 0;">
			{#if selectedNodes.length === 1}
				{firstSelectedNode.id}
				<div class="flex flex-col gap-2 p-2 border-l border-input bg-background w-96 h-full">
					<div class="flex flex-col gap-4">
						<div class="flex flex-col">
							<h2 class="text-lg font-semibold">Node settings</h2>
							<p class="text-sm text-muted-foreground">
								Configure the node settings below. You can change the node name, description.
							</p>
						</div>
						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-1">
								<Label>Node name</Label>
								<Input placeholder="i.e. My new node" />
							</div>
							<div class="flex flex-col gap-1">
								<Label>Node description</Label>
								<Textarea placeholder="i.e. This is a new node" />
							</div>
						</div>
						<Separator />

						<div class="flex flex-col">
							<h2 class="text-lg font-semibold">Properties</h2>
							<p class="text-sm text-muted-foreground">Configure the node properties below.</p>
						</div>
						<div class="flex flex-col gap-1">
							<Label>Provider</Label>
							<div class="flex gap-2">
								<Select.Root>
									<Select.Trigger>
										<Select.Value placeholder="Select a provider" />
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="openai">OpenAI</Select.Item>
										<Select.Item value="anthropic">Anthropic</Select.Item>
									</Select.Content>
								</Select.Root>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger asChild let:builder={dropdownBuilder}>
										<Tooltip.Root>
											<Tooltip.Trigger let:builder>
												<Button variant="outline" size="icon" builders={[builder, dropdownBuilder]}>
													<Link class="w-4 h-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>Connect to block</Tooltip.Content>
										</Tooltip.Root>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content>
										<DropdownMenu.Label>Connected blocks</DropdownMenu.Label>
										<DropdownMenu.Sub>
											<DropdownMenu.SubTrigger>
												<img
													src="https://static.horst.ai/openai-logomark.png"
													class="h-4 w-4 mr-2"
													alt=""
												/>
												Test Node
											</DropdownMenu.SubTrigger>
											<DropdownMenu.SubContent>
												<DropdownMenu.Label>Input</DropdownMenu.Label>
												<DropdownMenu.Item>Provider</DropdownMenu.Item>
												<DropdownMenu.Item>Model</DropdownMenu.Item>
												<DropdownMenu.Separator />
												<DropdownMenu.Label>Output</DropdownMenu.Label>
												<DropdownMenu.Item>Response</DropdownMenu.Item>
											</DropdownMenu.SubContent>
										</DropdownMenu.Sub>
										<DropdownMenu.Label>Connect to block</DropdownMenu.Label>
										<DropdownMenu.Item>More...</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<Label>Model</Label>
							<Select.Root>
								<Select.Trigger>
									<Select.Value placeholder="Select a model" />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="gpt-4o">GPT-4o</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<Separator />
						<h2 class="text-lg font-semibold">Messages</h2>
						<div class="flex flex-col gap-1">
							<Label>User message</Label>
							<Textarea placeholder="i.e. Hello, how are you?" />
						</div>
						<div class="flex gap-2 flex-wrap text-sm">
							<button class="text-blue-500 hover:underline flex items-center">
								+ Add System Message
							</button>
							<button class="text-blue-500 hover:underline flex items-center">
								+ Add User Message
							</button>
						</div>
					</div>
				</div>
			{/if}
		</Panel>
	</SvelteFlow>
</main>
