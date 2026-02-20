import { api } from "@/lib/api-client"
import type { ThumbnailJob } from "@/hooks/useThumbnailGeneration"

export type { ThumbnailJob }

export async function getThumbnails(): Promise<ThumbnailJob[]> {
    try {
        return await api.get<ThumbnailJob[]>('/api/v1/thumbnail', { requireAuth: true })
    } catch {
        return []
    }
}

export async function getThumbnail(id: string): Promise<ThumbnailJob | null> {
    try {
        return await api.get<ThumbnailJob>(`/api/v1/thumbnail/${id}`, { requireAuth: true })
    } catch {
        return null
    }
}

export async function deleteThumbnail(id: string): Promise<boolean> {
    try {
        await api.delete(`/api/v1/thumbnail/${id}`, { requireAuth: true })
        return true
    } catch {
        return false
    }
}
