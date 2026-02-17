
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function SubtitleEditorSkeleton() {
    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="flex flex-col gap-1">
                    <Skeleton className="h-6 w-80 mb-1" /> {/* Title */}
                    <Skeleton className="h-4 w-64" /> {/* Description */}
                </div>
                <Skeleton className="h-9 w-24 rounded-md" /> {/* Back Button */}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Skeleton className="h-9 w-32 rounded-md" /> {/* Download SRT */}
                <Skeleton className="h-9 w-36 rounded-md" /> {/* Save Changes */}
            </div>

            {/* Main Content Area: Video Player + Subtitle Editor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Video Player */}
                <div className="flex flex-col gap-4">
                    <Card className="p-0 overflow-hidden">
                        {/* Video Aspect Ratio Placeholder */}
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
                            <Skeleton className="absolute inset-0 w-full h-full rounded-b-none" />
                        </div>
                        <div className="p-4 border-t">
                            <Skeleton className="h-9 w-full rounded-md" /> {/* Download Video with Subtitles */}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Subtitle Editor */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-36" /> {/* Subtitles title */}
                        <Skeleton className="h-9 w-24 rounded-md" /> {/* Add Line button */}
                    </div>

                    {/* Subtitle Lines */}
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-48" /> {/* Timestamp */}
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-6 rounded-md" /> {/* Edit icon */}
                                    <Skeleton className="h-6 w-6 rounded-md" /> {/* Delete icon */}
                                </div>
                            </div>
                            <Skeleton className="h-10 w-full" /> {/* Textarea */}
                        </Card>
                    ))}
                    {/* Add one more small one for variety */}
                    <Card className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-32" /> {/* Timestamp */}
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-6 rounded-md" /> {/* Edit icon */}
                                <Skeleton className="h-6 w-6 rounded-md" /> {/* Delete icon */}
                            </div>
                        </div>
                        <Skeleton className="h-8 w-11/12" /> {/* Textarea */}
                    </Card>
                </div>
            </div>
        </div>
    );
}