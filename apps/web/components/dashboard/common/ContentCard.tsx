import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    FileText,
    BookOpen,
    MoreHorizontal,
    ExternalLink,
    Trash2,
    Download,
    CalendarDays,
    Loader2,
    Languages,
} from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

interface ContentCardProps {
    id: string;
    title: string;
    created_at: string;
    onDelete: () => Promise<void>;
    onExport?: (scriptId: string) => Promise<void>;
    setToDelete: (id: string | null) => void;
    type: "scripts" | "research" | "dubbing";
}

export function ContentCard({
    id,
    title,
    created_at,
    onDelete,
    onExport,
    setToDelete,
    type,
}: ContentCardProps) {
    const [isExporting, setIsExporting] = useState(false);

    const creationDate = new Date(created_at).toLocaleDateString();

    // Dynamic values based on type
    const linkHref = `/dashboard/${type}/${id}`;
    const Icon = type === "scripts" ? FileText : type === "dubbing" ? Languages : BookOpen;
    const deleteLabel = type === "scripts" ? "Delete Script" : type === "dubbing" ? "Delete Dubbing" : "Delete Research";
    const dialogDescription = type === "scripts"
        ? "This will permanently delete your script and all its associated data."
        : type === "dubbing"
        ? "This will permanently delete your dubbed media and all its associated data."
        : "This will permanently delete your research and all its associated data.";


    const handleExport = () => {
        if (!onExport) return;
        const exportPromise = onExport(id);
        const contentTypeName = type === 'scripts' ? 'script' : type === 'dubbing' ? 'dubbing' : 'research';

        setIsExporting(true);

        toast.promise(exportPromise, {
            loading: `Exporting your ${contentTypeName}...`,
            success: `Your ${contentTypeName} has been exported successfully!`,
            error: (err) => `Failed to export: ${err.message || 'An unknown error occurred'}`,
        });

        exportPromise.finally(() => {
            setIsExporting(false);
        });
    };

    return (
        <motion.div
            variants={itemVariants}
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.008 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-full"
        >
            <Card className="group relative h-full overflow-hidden rounded-lg transition-all duration-300 ease-in-out hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-400/5">
                <Link href={linkHref} passHref legacyBehavior>
                    <a className="block cursor-pointer p-5">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>

                            <div className="flex-grow">
                                <h3 className="md:font-semibold md:text-lg text-slate-800 dark:text-slate-100 md:leading-tight text-base font-medium">
                                    {title}
                                </h3>
                                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>{creationDate}</span>
                                </div>
                            </div>
                        </div>
                    </a>
                </Link>

                <div className="absolute top-4 right-4 z-10">
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    className="h-8 w-8 rounded-full transform-gpu transition-all duration-200 opacity-100 md:opacity-0 md:translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <DropdownMenuItem className="cursor-pointer" onClick={() => (window.location.href = linkHref)}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    <span>View</span>
                                </DropdownMenuItem>
                                {onExport &&
                                    (isExporting ? (
                                        <DropdownMenuItem disabled>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            <span>Exporting...</span>
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
                                            <Download className="mr-2 h-4 w-4" />
                                            <span>Export</span>
                                        </DropdownMenuItem>
                                    ))}

                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                        className="text-red-500 focus:text-red-500 cursor-pointer"
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={() => setToDelete(id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>{deleteLabel}</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setToDelete(null)}>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={onDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {deleteLabel}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </Card>
        </motion.div>
    );
}