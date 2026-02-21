"use client"

import type React from "react"
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { type SupabaseClient, type User, type Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { UserProfile } from "@repo/validation"

type SupabaseContext = {
  supabase: SupabaseClient
  user: User | null
  session: Session | null
  providerToken: string | null
  loading: boolean
  setSession: Dispatch<SetStateAction<Session | null>>
  setProviderToken: Dispatch<SetStateAction<string | null>>
  profile: UserProfile | null
  setProfile: Dispatch<SetStateAction<UserProfile | null>>
  profileLoading: boolean
  fetchUserProfile: (userId: string) => Promise<void>
  logout: () => Promise<void>
}

// Suspense boundary helpers
let sessionPromise: Promise<Session | null> | null = null
const profilePromises = new Map<string, Promise<UserProfile | null>>() // keyed by userId

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])

  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [providerToken, setProviderToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const isLoggingOut = useRef(false)

  // Generate referral code
  function generateReferralCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  }

  // Profile fetch with suspense support
  const fetchUserProfile = async (userId: string): Promise<void> => {
    setProfileLoading(true)
    try {
      let profilePromise = profilePromises.get(userId)
      // if (!profilePromise) {
      profilePromise = (async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "avatar_url, email, full_name, credits, ai_trained, youtube_connected, language, referral_code"
          )
          .eq("user_id", userId)
          .single()

        if (error) {
          console.error("Profile fetch error:", error.message)
          return null
        }

        // Ensure referral_code exists
        if (!data.referral_code) {
          const referral = generateReferralCode()
          const { data: updated, error: updateError } = await supabase
            .from("profiles")
            .update({ referral_code: referral })
            .eq("user_id", userId)
            .select(
              "avatar_url, email, full_name, credits, ai_trained, youtube_connected, language, referral_code"
            )
            .single()

          if (!updateError && updated) {
            return updated as UserProfile
          }
        }

        return data as UserProfile
      })()
      profilePromises.set(userId, profilePromise)
      // }

      const result = await profilePromise
      setProfile(result)
    } finally {
      setProfileLoading(false)
    }
  }

  // Initial session loader
  const getInitialSession = async (): Promise<Session | null> => {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Error fetching session:", error.message)
      return null
    }
    return data.session
  }

  useEffect(() => {
    let mounted = true

    if (!sessionPromise) {
      sessionPromise = getInitialSession()
    }

    sessionPromise
      .then((sess) => {
        if (!mounted) return
        setSession(sess)
        setUser(sess?.user ?? null)
        setProviderToken((sess as any)?.provider_token ?? null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isLoggingOut.current) return
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setProviderToken((newSession as any)?.provider_token ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const logout = async () => {
    isLoggingOut.current = true
    await supabase.auth.signOut()
  }

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id)
    } else {
      setProfile(null)
      setProfileLoading(false)
    }
  }, [user?.id])

  const value: SupabaseContext = {
    supabase,
    user,
    session,
    providerToken,
    loading,
    setSession,
    setProviderToken,
    profile,
    setProfile,
    profileLoading,
    fetchUserProfile,
    logout,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}
