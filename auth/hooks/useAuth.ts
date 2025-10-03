"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"

/**
 * Custom hook for managing authentication state and protected routes
 * @returns An object containing authentication state and utility functions
 */
export function useAuth() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const isAuthenticated = status === "authenticated"
    const isLoading = status === "loading"
    const isAdmin = session?.user?.role === "admin"

    /**
     * Ensures a user is authenticated before executing a callback
     * @param callback - Function to execute if user is authenticated
     */
    const requireAuth = useCallback((callback: () => void) => {
        if (!isAuthenticated && !isLoading) {
            router.push("/auth/login")
            return
        }
        callback()
    }, [isAuthenticated, isLoading, router])

    /**
     * Ensures a user has admin privileges before executing a callback
     * @param callback - Function to execute if user is an admin
     */
    const requireAdmin = useCallback((callback: () => void) => {
        if (!isAdmin && !isLoading) {
            router.push("/auth/unauthorized")
            return
        }
        callback()
    }, [isAdmin, isLoading, router])

    return {
        session,
        status,
        loading,
        setLoading,
        isAuthenticated,
        isLoading,
        isAdmin,
        requireAuth,
        requireAdmin,
        updateSession: update
    }
}
