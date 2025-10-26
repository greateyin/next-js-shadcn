"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

type SessionProviderProps = {
    children: React.ReactNode;
    session?: any;
}

export function SessionProvider({
    children,
    session
}: SessionProviderProps) {
    return (
        <NextAuthSessionProvider
            session={session}
            // ✅ FIX: Automatically refresh session to ensure latest user data
            // This fixes the avatar display issue where user data wasn't being updated
            refetchInterval={5 * 60} // Refresh every 5 minutes
            refetchOnWindowFocus={true} // Refresh when window regains focus
            // ⚠️ NOTE: Do NOT set basePath here
            // Auth.js V5 automatically detects basePath from the auth config
            // Setting it here can cause issues with session endpoint detection
        >
            {children}
        </NextAuthSessionProvider>
    )
}