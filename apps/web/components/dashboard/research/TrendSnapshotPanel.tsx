"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, Zap, Target, Eye, ExternalLink } from "lucide-react";
import type { TrendSnapshot } from "@repo/validation";

interface TrendSnapshotPanelProps {
  snapshot: TrendSnapshot;
}

export default function TrendSnapshotPanel({ snapshot }: TrendSnapshotPanelProps) {
  return (
    <div className="space-y-4">
      {snapshot.trendingTopics?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshot.trendingTopics.slice(0, 8).map((t, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{t.topic}</span>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, t.momentum)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{t.momentum}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {snapshot.earlySignals?.length > 0 && (
        <Card className="border-green-200 dark:border-green-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-green-500" /> Early Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {snapshot.earlySignals.map((s, i) => (
                <Badge key={i} className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/40 text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {snapshot.nicheGaps?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Target className="h-4 w-4 text-purple-500" /> Niche Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {snapshot.nicheGaps.map((g, i) => (
                <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                  <span className="text-purple-400 mt-1">+</span> {g}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {snapshot.saturatedTopics?.length > 0 && (
        <Card className="border-red-200 dark:border-red-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Saturated (Avoid)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {snapshot.saturatedTopics.map((t, i) => (
                <Badge key={i} variant="destructive" className="text-xs font-normal">{t}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {snapshot.competitorInsights?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-slate-500" /> Competitor Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshot.competitorInsights.slice(0, 5).map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 group hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-1.5 rounded">
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.views.toLocaleString()} views</p>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
