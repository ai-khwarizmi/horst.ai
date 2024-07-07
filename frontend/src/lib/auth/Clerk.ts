import { browser } from "$app/environment";
import { env } from "$env/dynamic/public";
import * as CLERK from "@clerk/clerk-js";
import { writable } from "svelte/store";

let PUBLIC_CLERK_PUBLISHABLE_KEY: string | undefined = undefined;
if (browser) {
    PUBLIC_CLERK_PUBLISHABLE_KEY = env.PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export const clerk = writable<CLERK.Clerk | null>(null);

export type User = {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
    emailVerified: boolean;
};

export const usesClerk = PUBLIC_CLERK_PUBLISHABLE_KEY !== undefined;
export const clerkLoaded = writable(false);
export const session = writable<User | null>(null);

export const attemptClerkInit = async () => {
    if (!browser) return
    if (PUBLIC_CLERK_PUBLISHABLE_KEY) {
        try {
            const _clerk = new CLERK.Clerk(PUBLIC_CLERK_PUBLISHABLE_KEY);
            initClerk(_clerk);
            clerk.set(_clerk);
            await _clerk.load()
            clerkLoaded.set(true);
        } catch (err) {
            console.error("Failed to load Clerk", err);
            clerk.set(null);
            clerkLoaded.set(true);
        }
    }
}

const initClerk = (clerk: CLERK.Clerk) => {
    if (!browser) return;
    clerk.addListener(async ({ client, session: sess, user }) => {
        if (user) {
            const email = user.primaryEmailAddress?.emailAddress || null;
            const emailVerified = user.primaryEmailAddress?.verification.status === "verified";
            session.set({
                id: user.id,
                name: user.username || user.firstName || user.fullName || null,
                image: user.hasImage ? user.imageUrl : null,
                email,
                emailVerified
            });

        } else {
            session.set(null);
        }
    })
}