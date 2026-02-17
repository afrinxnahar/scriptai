"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import { Loader2, Download, Clock } from "lucide-react"

export default function ThumbnailGenerator() {
  const { toast } = useToast()
  const { user } = useSupabase()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [style, setStyle] = useState("")
  const [loading, setLoading] = useState(false)
  const [thumbnailDescription, setThumbnailDescription] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [isComingSoon] = useState(false) // Toggle this to false when feature is released

  const handleGenerateThumbnail = async () => {
    if (isComingSoon) return // Prevent interaction when coming soon
    if (!title) {
      toast({
        title: "Title required",
        description: "Please enter a title to generate a thumbnail.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/create-thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          style,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to generate thumbnail")
      }

      const data = await response.json()
      setThumbnailDescription(data.thumbnailDescription)
      setThumbnailUrl(data.imageUrl)

      toast({
        title: "Thumbnail generated!",
        description: "Your thumbnail description has been generated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error generating thumbnail",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Thumbnail Generator</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Create eye-catching thumbnails for your YouTube videos
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Thumbnail</TabsTrigger>
          <TabsTrigger value="preview" disabled={!thumbnailUrl || isComingSoon}>
            Preview & Download
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card className="relative">
            <CardHeader>
              <CardTitle>Thumbnail Generator</CardTitle>
              <CardDescription>Fill in the details below to generate your thumbnail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Video Title (Required)</Label>
                <Input
                  id="title"
                  placeholder="e.g., 10 Productivity Hacks That Changed My Life"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading || isComingSoon}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter the title of your video to create a relevant thumbnail
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Video Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., In this video, I share my top productivity tips that helped me save 3 hours every day"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading || isComingSoon}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Add a brief description to help generate a more targeted thumbnail
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Thumbnail Style</Label>
                <Select value={style} onValueChange={setStyle} disabled={loading || isComingSoon}>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="bold">Bold & Colorful</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Choose a style that matches your brand and video content
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerateThumbnail}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white"
                disabled={loading || isComingSoon}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Thumbnail"
                )}
              </Button>
            </CardFooter>

            {isComingSoon && (
              <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Clock className="h-12 w-12 mx-auto text-slate-500 dark:text-slate-400" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Coming Soon
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md">
                    Stay tuned to unlock this exciting feature to create eye-catching thumbnails for your YouTube videos!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/topics")}
                    className="bg-slate-950 hover:bg-slate-900 text-white"
                  >
                    Back to Topics
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="relative">
            <CardHeader>
              <CardTitle>Preview & Download</CardTitle>
              <CardDescription>Review your generated thumbnail and download it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Generated Thumbnail</Label>
                <div className="border rounded-md overflow-hidden">
                  <img
                    src={thumbnailUrl || "/placeholder.svg?height=720&width=1280"}
                    alt="Generated thumbnail"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail Description</Label>
                <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900 whitespace-pre-wrap">
                  {thumbnailDescription}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This description can help you create the actual thumbnail in your preferred design tool
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setThumbnailUrl("")} disabled={isComingSoon}>
                Generate New
              </Button>
              <Button className="bg-slate-950 hover:bg-slate-900 text-white" disabled={isComingSoon}>
                <Download className="mr-2 h-4 w-4" />
                Download Thumbnail
              </Button>
            </CardFooter>

            {isComingSoon && (
              <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Clock className="h-12 w-12 mx-auto text-slate-500 dark:text-slate-400" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Coming Soon
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md">
                    Stay tuned to unlock this exciting feature to create eye-catching thumbnails for your YouTube videos!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/topics")}
                    className="bg-slate-950 hover:bg-slate-900 text-white"
                  >
                    Back to Topics
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}