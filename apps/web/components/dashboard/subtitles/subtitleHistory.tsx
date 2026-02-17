"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns"; // Optional: efficient date formatting
import { toast } from "sonner";
import {
    CheckCircle2, Loader2, Clock, AlertCircle, FileVideo,
    MoreHorizontal, Edit, Download, Trash2
} from "lucide-react";

import { SubtitleLine, SubtitleResponse } from "@repo/validation";
import { api } from "@/lib/api-client";

// UI Components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub,
    DropdownMenuSubTrigger, DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { SubtitleHistorySkeleton } from "./skeleton/SubtitleHistorySkeleton";
import { convertJsonToSrt } from "@/utils/convertJsonToSrt";
import { convertJsonToVTT } from "@/utils/vttHelper";

// --- Types ---
type SubtitleHistoryProps = {
    subtitles: SubtitleResponse[];
    isLoading: boolean;
    error: string | null;
    onDelete: (id: string) => Promise<void>;
};

// --- Main Component ---
export function SubtitleHistory({ subtitles, isLoading, error, onDelete }: SubtitleHistoryProps) {
    const [itemToDelete, setItemToDelete] = useState<SubtitleResponse | null>(null);

    // Sort by date (Newest first)
    const sortedData = useMemo(() =>
        [...subtitles].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [subtitles]
    );

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const id = itemToDelete.id;
        setItemToDelete(null);
        await onDelete(id);
    };

    if (error) return <ErrorState message={error} />;

    return (
        <>
            <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100 py-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        <FileVideo className="h-5 w-5 text-purple-600" />
                        Subtitle History
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <SubtitleHistorySkeleton />
                    ) : (
                        <div className="overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Language</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {sortedData.length > 0 ? (
                                            sortedData.map((item) => (
                                                <SubtitleRow
                                                    key={item.id}
                                                    item={item}
                                                    onDeleteClick={() => setItemToDelete(item)}
                                                />
                                            ))
                                        ) : (
                                            <EmptyState />
                                        )}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subtitle?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <span className="font-bold text-gray-900">{itemToDelete?.filename}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// --- Sub-Component: Table Row ---
function SubtitleRow({ item, onDeleteClick }: { item: SubtitleResponse, onDeleteClick: () => void }) {
    const router = useRouter();
    const [isDownloading, setIsDownloading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleDownload = async (format: "srt" | "vtt") => {
        setIsDownloading(true);
        try {
            const res = await api.get<{ success: boolean, subtitle: SubtitleResponse }>(`/api/v1/subtitle/${item.id}`, { requireAuth: true });
            if (!res.success) throw new Error("Fetch failed");

            const subtitles = JSON.parse(res.subtitle.subtitles_json || "[]");
            const content = format === "srt" ? convertJsonToSrt(subtitles as SubtitleLine[]) : convertJsonToVTT(subtitles as SubtitleLine[]);
            triggerFileDownload(content, `${item.filename}.${format}`);

            toast.success(`Downloaded .${format}`);
        } catch (e) {
            toast.error("Download failed");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleRowClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return;
        router.push(`/dashboard/subtitles/${item.id}`);
    };

    const handleDeleteClick = () => {
        setDropdownOpen(false);
        onDeleteClick();
    };

    return (
        <motion.tr
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, backgroundColor: "#fee2e2" }}
            transition={{ duration: 0.2 }}
            onClick={handleRowClick}
            className="group cursor-pointer border-b border-gray-50 hover:bg-purple-50/40 transition-colors"
        >
            <TableCell className="font-medium text-gray-900">{item.filename}</TableCell>
            <TableCell className="text-gray-500">{new Date(item.created_at).toLocaleDateString()}</TableCell>
            <TableCell><StatusBadge status={item.status} /></TableCell>
            <TableCell className="uppercase text-xs font-bold text-gray-500">{item.language}</TableCell>
            <TableCell className="text-right">
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-purple-600">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/subtitles/${item.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>

                        {item.status === "done" && (
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Download
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => handleDownload('srt')}>.SRT Format</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload('vtt')}>.VTT Format</DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDeleteClick}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </motion.tr>
    );
}

// --- Helper Components & Functions ---

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        done: { icon: CheckCircle2, color: "text-green-600 border-green-200 bg-green-50" },
        processing: { icon: Loader2, color: "text-blue-600 border-blue-200 bg-blue-50", animate: true },
        queued: { icon: Clock, color: "text-gray-500 border-gray-200 bg-gray-50" },
        failed: { icon: AlertCircle, color: "text-red-600 border-red-200 bg-red-50" },
    }[status] || { icon: Clock, color: "text-gray-500" };

    const Icon = config.icon;
    return (
        <Badge variant="outline" className={`gap-1.5 pl-1.5 pr-2.5 py-0.5 ${config.color}`}>
            <Icon className={`h-3.5 w-3.5 ${config.animate ? 'animate-spin' : ''}`} />
            <span className="capitalize">{status}</span>
        </Badge>
    );
};

const ErrorState = ({ message }: { message: string }) => (
    <Card className="border-red-100 bg-red-50/30">
        <CardContent className="flex flex-col items-center py-10 text-red-600">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Error: {message}</p>
        </CardContent>
    </Card>
);

const EmptyState = () => (
    <TableRow>
        <TableCell colSpan={5} className="h-40 text-center text-gray-400">
            <div className="flex flex-col items-center gap-2">
                <FileVideo className="h-10 w-10 opacity-20" />
                <p>No subtitles found yet.</p>
            </div>
        </TableCell>
    </TableRow>
);



const triggerFileDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
