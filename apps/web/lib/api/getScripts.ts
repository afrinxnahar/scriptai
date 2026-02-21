import type { Script } from "@repo/validation";
import { api } from "@/lib/api-client";

export type { Script };

export async function getScripts(): Promise<Script[]> {
    try {
        return await api.get<Script[]>("/api/v1/script", { requireAuth: true });
    } catch (error) {
        console.error("Error fetching scripts:", error);
        return [];
    }
}

export async function updateScript(
    id: string,
    data: Partial<Pick<Script, "title" | "content">>
): Promise<Script | null> {
    try {
        return await api.patch<Script>(`/api/v1/script/${id}`, data, { requireAuth: true });
    } catch (error) {
        console.error(`Error updating script with ID ${id}:`, error);
        return null;
    }
}

export async function deleteScript(id: string): Promise<boolean> {
    try {
        await api.delete(`/api/v1/script/${id}`, { requireAuth: true });
        return true;
    } catch (error) {
        console.error(`Error deleting script with ID ${id}:`, error);
        return false;
    }
}