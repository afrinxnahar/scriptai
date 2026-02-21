"use client";

import { useState, useEffect, useCallback, FC } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ResearchTopic } from "@repo/validation/src/types/researchTopicTypes";
import { api } from "@/lib/api-client";

const RecentTopicsSkeleton: FC = () => (
    <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-14" />
            </div>
        ))}
    </div>
);

export default function RecentTopicsList() {
    const router = useRouter();
    const [recentTopics, setRecentTopics] = useState<ResearchTopic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(true);

    const fetchRecentTopics = useCallback(async () => {
        setLoadingTopics(true);
        try {
            const data = await api.get<ResearchTopic[]>("/api/v1/research", { requireAuth: true });
            setRecentTopics(data || []);
        } catch (error: any) {
            toast.error("Error fetching recent topics", { description: error.message });
        } finally {
            setLoadingTopics(false);
        }
    }, []);

    useEffect(() => {
        fetchRecentTopics();
    }, [fetchRecentTopics]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Research</CardTitle>
                <CardDescription>View your previous topics.</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingTopics ? <RecentTopicsSkeleton /> :
                    recentTopics.length > 0 ? (
                        <div className="space-y-3">
                            {recentTopics.slice(0, 4).map((t) => (
                                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => router.push(`/dashboard/research/${t.id}`)} role="button">
                                    <div>
                                        <h3 className="font-medium text-sm">{t.topic}</h3>
                                        <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground">
                            <BookOpen className="h-8 w-8 mx-auto mb-2" />
                            <p>Your recent topics will appear here.</p>
                        </div>
                    )}
            </CardContent>
        </Card>
    );
}