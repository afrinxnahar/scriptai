"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3 } from "lucide-react";
import type { IdeationIdea } from "@repo/validation";

interface OpportunityScoreChartProps {
  ideas: IdeationIdea[];
}

const getBarColor = (score: number) => {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
};

export default function OpportunityScoreChart({ ideas }: OpportunityScoreChartProps) {
  const data = ideas.map((idea, i) => ({
    name: `Idea ${i + 1}`,
    score: idea.opportunityScore,
    title: idea.title.length > 30 ? idea.title.slice(0, 30) + "..." : idea.title,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-purple-500" /> Opportunity Scores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={ideas.length * 52 + 20}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [`${value}/100`, "Score"]}
              labelFormatter={(label: string) => {
                const item = data.find(d => d.name === label);
                return item?.title || label;
              }}
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
