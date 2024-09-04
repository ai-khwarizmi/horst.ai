<script context="module" lang="ts">
	import { writable } from 'svelte/store';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import { toast } from 'svelte-sonner';
	import Button from '$lib/components/ui/button/button.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';

	let open = writable(false);

	export function openShareGraphModal() {
		console.log('openShareGraphModal');
		open.set(true);
	}
</script>

<script lang="ts">
	let newEmail = '';
	let generalAccess = 'restricted';
	let users = [{ email: 'you@example.com', role: 'Owner', avatar: 'T' }];
	let shareLink = 'https://example.com/share/abc123'; // Placeholder link
	let newEmails: { email: string; role: 'Viewer' | 'Editor' }[] = [];
	let notifyPeople = true;
	let notificationMessage = '';

	const changeUserRole = async (email: string, newRole: string) => {
		// TODO: Call API to change user role
		console.log('Changing role for', email, 'to', newRole);
		users = users.map((u) => (u.email === email ? { ...u, role: newRole } : u));
		toast.success('User role updated');
	};

	const changeGeneralAccess = async (newAccess: string) => {
		// TODO: Call API to change general access
		console.log('Changing general access to:', newAccess);
		generalAccess = newAccess;
		toast.success('General access updated');
	};

	const copyLink = () => {
		navigator.clipboard.writeText(shareLink);
		toast.success('Link copied to clipboard');
	};

	const addEmail = () => {
		if (newEmail && !newEmails.find((u) => u.email === newEmail)) {
			newEmails = [...newEmails, { email: newEmail, role: 'Editor' }];
			newEmail = '';
		}
	};

	const removeEmail = (email: string) => {
		newEmails = newEmails.filter((u) => u.email !== email);
	};

	const sendInvitations = async () => {
		// TODO: Call API to send invitations
		console.log(
			'Sending invitations:',
			newEmails,
			'Notify:',
			notifyPeople,
			'Message:',
			notificationMessage
		);
		for (const user of newEmails) {
			users = [...users, { ...user, avatar: user.email[0].toUpperCase() }];
		}
		newEmails = [];
		notificationMessage = '';
		toast.success('Invitations sent successfully');
		open.set(false);
	};

	const handleRoleChange = (email: string) => (event: Event) => {
		const target = event.target as HTMLSelectElement;
		changeUserRole(email, target.value);
	};
</script>

<Dialog.Root bind:open={$open}>
	<Dialog.Content class="w-full max-w-md">
		<Dialog.Header>
			<Dialog.Title>Share "Untitled document"</Dialog.Title>
		</Dialog.Header>
		<div class="space-y-4">
			<Input
				placeholder="Add people"
				bind:value={newEmail}
				on:keydown={(e) => e.key === 'Enter' && addEmail()}
			/>

			{#if newEmails.length > 0}
				<div class="space-y-2">
					{#each newEmails as email}
						<div class="flex items-center justify-between">
							<div>{email.email}</div>
							<div class="flex items-center space-x-2">
								<select bind:value={email.role}>
									<option value="Viewer">Viewer</option>
									<option value="Editor">Editor</option>
								</select>
								<button on:click={() => removeEmail(email.email)}>×</button>
							</div>
						</div>
					{/each}
				</div>

				<div class="flex items-center space-x-2">
					<Checkbox bind:checked={notifyPeople} id="notify-people" />
					<label for="notify-people">Notify people</label>
				</div>

				{#if notifyPeople}
					<textarea
						bind:value={notificationMessage}
						placeholder="Add a message (optional)"
						class="w-full h-24 p-2 border rounded"
					></textarea>
				{/if}

				<div class="flex justify-end space-x-2">
					<Button variant="outline" on:click={() => (newEmails = [])}>Cancel</Button>
					<Button on:click={sendInvitations}>Send</Button>
				</div>
			{:else}
				<div>
					<h3 class="text-sm font-semibold mb-2">People with access</h3>
					{#each users as user}
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center">
								<div class="w-8 h-8 mr-2 bg-gray-200 rounded-full flex items-center justify-center">
									{user.avatar}
								</div>
								<div>
									<div>{user.email}</div>
									<div class="text-sm text-gray-500">{user.role}</div>
								</div>
							</div>
							<select value={user.role} on:change={handleRoleChange(user.email)}>
								<option value="Editor">Editor</option>
								<option value="Viewer">Viewer</option>
							</select>
						</div>
					{/each}
				</div>

				<div>
					<h3 class="text-sm font-semibold mb-2">General access</h3>
					<select bind:value={generalAccess} on:change={() => changeGeneralAccess(generalAccess)}>
						<option value="restricted">Restricted</option>
						<option value="org-wide" disabled>Organization-wide (Coming soon)</option>
						<option value="anyone">Anyone with the link</option>
					</select>
					<p class="text-sm text-gray-500 mt-1">
						{#if generalAccess === 'restricted'}
							Only people with access can open with the link
						{:else if generalAccess === 'anyone'}
							Anyone on the internet with the link can view
						{/if}
					</p>
				</div>

				<div>
					<Button on:click={copyLink} variant="outline" class="w-full justify-start">
						<span class="mr-2">🔗</span> Copy link
					</Button>
				</div>

				<Dialog.Footer>
					<Button on:click={() => open.set(false)}>Done</Button>
				</Dialog.Footer>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
