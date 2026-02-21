"use client"

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, AlertCircle, Eye, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton";
import { CONTENT_TYPE_LABELS, VIDEO_DURATION_LABELS } from "@repo/validation";
import type { StoryBuilderJob } from "@/hooks/useStoryBuilder"

interface StoryBuilderHistoryProps {
  jobs: StoryBuilderJob[]
  isLoading: boolean
  onView: (job: StoryBuilderJob) => void
  onDelete: (jobId: string) => void
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  queued: { label: "Queued", variant: "outline" },
  processing: { label: "Processing", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
}

export function StoryBuilderHistory({ jobs, isLoading, onView, onDelete }: StoryBuilderHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Story Blueprints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Story Blueprints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No story blueprints generated yet</p>
            <p className="text-sm mt-1">Your generated story structures will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Story Blueprints
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.map((job, idx) => {
          const config = statusConfig[job.status] || statusConfig.queued

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{job.video_topic}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={config && config.variant} className="text-xs">
                      {config && config.label}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {CONTENT_TYPE_LABELS[job.content_type]} · {VIDEO_DURATION_LABELS[job.video_duration]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  {job.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onView(job)}
                      title="View result"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => onDelete(job.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {job.status === 'failed' && job.error_message && (
                <div className="flex items-start gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="truncate">{job.error_message}</span>
                </div>
              )}

              {job.status === 'completed' && job.result && (
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {job.result.retentionBeats?.length || 0} retention beats
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {job.result.openLoops?.length || 0} open loops
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {job.result.patternInterrupts?.length || 0} pattern interrupts
                  </Badge>
                </div>
              )}
            </motion.div>
          )
        })}
      </CardContent>
    </Card>
  )
}
