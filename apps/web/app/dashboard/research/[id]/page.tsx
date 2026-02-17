"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import ResearchDetails from "@/components/dashboard/research/ResearchDetails";
import { ResearchTopic } from "@repo/validation";

// interface ResearchTopic {
//   id: string;
//   topic: string;
//   context?: string;
//   created_at: string;
//   research_data: {
//     summary: string;
//     keyPoints: string[];
//     trends: string[];
//     questions: string[];
//     contentAngles: string[];
//     sources: string[];
//   };
// }

export default function TopicDetails() {
  const router = useRouter();
  const params = useParams();
  const researchId = params.id as string;
  const [research, setResearch] = useState<ResearchTopic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopic = async () => {
      if (!researchId) return;

      try {
        const response = await fetch(`/api/research-topic/${researchId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch research topic");
        }

        const data = await response.json();
        setResearch(data);
      } catch (error: any) {
        toast.error("Error fetching research topic", {
          description: error.message,
        });
        router.push("/dashboard/research"); // Redirect to topics list on error
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [researchId, router]);

  return (
    <ResearchDetails loading={loading} research={research} />

  );
}