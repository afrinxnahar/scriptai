
"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GmailPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (gmail: string) => void
  isLoading?: boolean
}

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i

export function GmailPromptDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: GmailPromptDialogProps) {
  const [gmail, setGmail] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmed = gmail.trim()
    if (!trimmed) {
      setError("Please enter your Gmail address.")
      return
    }
    if (!GMAIL_REGEX.test(trimmed)) {
      setError("Please enter a valid Gmail address (e.g. you@gmail.com).")
      return
    }

    onSubmit(trimmed)
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setGmail("")
      setError("")
    }
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 mb-2">
            <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <DialogTitle className="text-center text-xl">
            Enter Your Gmail Address
          </DialogTitle>
          <DialogDescription className="text-center">
            {"Since you didn't sign up with Google, we need the Gmail address associated with your YouTube channel to connect it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="gmail">Gmail Address</Label>
            <Input
              id="gmail"
              type="email"
              placeholder="you@gmail.com"
              value={gmail}
              onChange={(e) => {
                setGmail(e.target.value)
                if (error) setError("")
              }}
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Connecting..." : "Continue with Google"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
