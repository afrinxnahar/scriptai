"use client"

import { useState, useRef, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Copy, Check, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScriptContentEditorProps {
  title: string
  setTitle: (v: string) => void
  content: string
  setContent: (v: string) => void
  onCopyTitle?: () => void
  onCopyScript?: () => void
  copiedTitle?: boolean
  copiedScript?: boolean
  contentClassName?: string
}

export function ScriptContentEditor({
  title,
  setTitle,
  content,
  setContent,
  onCopyTitle,
  onCopyScript,
  copiedTitle = false,
  copiedScript = false,
  contentClassName,
}: ScriptContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const startEditing = useCallback(() => {
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [])

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="script-title">Title</Label>
        <div className="relative">
          <Input
            id="script-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Script title"
            className="pr-10 focus-visible:ring-purple-500"
          />
          {onCopyTitle && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={onCopyTitle}
            >
              {copiedTitle ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="script-content">Content</Label>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={startEditing}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {onCopyScript && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onCopyScript}>
                {copiedScript ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <Textarea
            ref={textareaRef}
            id="script-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => setIsEditing(false)}
            placeholder="Write your script in Markdown..."
            className={cn(
              "min-h-[400px] font-mono text-sm focus-visible:ring-purple-500 resize-y",
              contentClassName
            )}
          />
        ) : (
          <div
            onClick={startEditing}
            className={cn(
              "min-h-[400px] max-h-[500px] overflow-y-auto w-full rounded-md border border-input bg-transparent px-4 py-3 text-sm cursor-text",
              "prose dark:prose-invert max-w-none",
              "hover:border-purple-400 transition-colors",
              contentClassName
            )}
          >
            {content ? (
              <ReactMarkdown
                components={{
                  strong: ({ node, ...props }) => <span className="font-bold text-purple-600" {...props} />,
                  em: ({ node, ...props }) => <span className="italic text-slate-500" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />,
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <span className="text-muted-foreground">Click to edit script content...</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
