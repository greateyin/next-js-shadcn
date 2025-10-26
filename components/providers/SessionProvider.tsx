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
    // ✅ Debug: Log session being passed from server
    console.log('[SessionProvider] Received session from server:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userName: session?.user?.name,
        userEmail: session?.user?.email,
        sessionKeys: session ? Object.keys(session) : [],
        userKeys: session?.user ? Object.keys(session.user) : [],
        fullSession: JSON.stringify(session),
    });

    return (
        <NextAuthSessionProvider
            session={session}
            // ✅ FIX: Automatically refresh session to ensure latest user data
            // This fixes the avatar display issue where user data wasn't being updated
            refetchInterval={5 * 60} // Refresh every 5 minutes
            refetchOnWindowFocus={true} // Refresh when window regains focus
            // ✅ FIX: Ensure basePath matches auth config
            basePath="/api/auth"
        >
            {children}
        </NextAuthSessionProvider>
    )
}