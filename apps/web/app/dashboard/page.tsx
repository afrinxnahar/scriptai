"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PenTool, Upload, ImageIcon, FileText, Plus, ArrowRight, Youtube, XCircle } from "lucide-react"
import { useSupabase } from "@/components/supabase-provider"
import { toast } from "sonner"
import { Script, UserProfile } from "@repo/validation"



export default function Dashboard() {
  const { supabase, user, session } = useSupabase()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentScripts, setRecentScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingYoutube, setConnectingYoutube] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        // Fetch user profile including youtube_connected
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("avatar_url, email, full_name, credits, ai_trained, youtube_connected")
          .eq("user_id", user.id)
          .single();

        if (profileError) throw profileError

        // Fetch recent scripts
        const { data: scriptsData, error: scriptsError } = await supabase
          .from("scripts")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3)

        if (scriptsError) throw scriptsError

        setProfile(profileData as UserProfile)
        setRecentScripts(scriptsData || [])
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch user data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, user])

  const connectYoutubeChannel = async () => {
    setConnectingYoutube(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/youtube/callback`,
          scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/youtube.readonly',
          queryParams: {
            access_type: 'offline', // Ensures refresh token is returned
            prompt: 'consent', // Forces consent screen
          },
        },
      })

      if (error) throw error

      if (data.url) {
        window.location.href = data.url // Redirect to Google consent screen
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to connect YouTube channel")
    } finally {
      setConnectingYoutube(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-950 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile?.full_name || "Creator"}</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Available Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile?.credits || 0}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use credits to generate scripts and other content
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">YouTube Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {profile?.youtube_connected ? (
                <Youtube className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-700" />
              )}
              <div className="text-xl font-bold">
                {profile?.youtube_connected ? (
                  <span className="text-green-500">Connected</span>
                ) : (
                  <span className="text-rose-700">Not Connected</span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {profile?.youtube_connected
                ? "YouTube channel is connected"
                : "Connect your YouTube channel to personalize your AI"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">AI Training Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {profile?.ai_trained ? (
                <span className="text-green-500">Trained</span>
              ) : (
                <span className="text-rose-700">Not Trained</span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {profile?.ai_trained
                ? "Your AI is trained and ready to generate personalized scripts"
                : "Train your AI to generate personalized scripts"}
            </p>
            {!profile?.ai_trained && (
              <Link href="/dashboard/train">
                <Button size="sm" variant={"outline"} className="mt-2 ">
                  Train Now
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Free Plan</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upgrade to Pro for unlimited scripts and more features
            </p>
            <Link href="#upgrade">
              <Button size="sm" variant="outline" className="mt-2">
                Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>

      {/* Getting Started */}
      <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {!profile?.youtube_connected && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Youtube className="h-10 w-10 text-zinc-900 mb-4" />
              <CardTitle className="text-lg mb-1">Connect YouTube</CardTitle>
              <CardDescription>Link your YouTube channel to personalize your AI</CardDescription>
              <Button
                size="sm"
                className="mt-4 bg-slate-900 hover:bg-slate-800 text-white"
                onClick={connectYoutubeChannel}
                disabled={connectingYoutube}
              >
                {connectingYoutube ? "Connecting..." : "Connect"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Link href="/dashboard/train">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Upload className="h-10 w-10 text-zinc-900 mb-4" />
              <CardTitle className="text-lg mb-1">Train AI</CardTitle>
              <CardDescription>Upload videos to train your AI model</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/scripts/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <PenTool className="h-10 w-10 text-zinc-900 mb-4" />
              <CardTitle className="text-lg mb-1">Create Script</CardTitle>
              <CardDescription>Generate a new script for your video</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/thumbnails">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <ImageIcon className="h-10 w-10 text-zinc-900 mb-4" />
              <CardTitle className="text-lg mb-1">Research a Topic</CardTitle>
              <CardDescription>Research topics effortlessly using your trained AI</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Scripts */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Scripts</h2>
        <Link href="/dashboard/scripts">
          <Button variant="ghost" size="sm" className="gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {recentScripts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 mb-8">
          {recentScripts.map((script) => (
            <Card key={script.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{script.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {new Date(script.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/dashboard/scripts/${script.id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="font-semibold mb-2">No scripts yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Create your first script to get started</p>
            <Link href="/dashboard/scripts/new">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="h-4 w-4 mr-2" /> Create Script
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}