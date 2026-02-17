
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileVideo } from "lucide-react";


export function SubtitleHistorySkeleton() {
    const skeletonRows = Array.from({ length: 4 });

    return (
        <Card className="border-0 shadow-none">
            <CardContent className="p-0">
                <div className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="font-semibold">File</TableHead>
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Language</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {skeletonRows.map((_, index) => (
                                <TableRow key={index} className="border-b border-gray-50">
                                    <TableCell>
                                        <Skeleton className="h-4 w-3/4" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-[100px]" />
                                    </TableCell>
                                    <TableCell>
                                        {/* Skeleton for the Badge */}
                                        <Skeleton className="h-6 w-[90px] rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        {/* Skeleton for the Language code */}
                                        <Skeleton className="h-4 w-[40px]" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Skeleton for the ... Button */}
                                        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}