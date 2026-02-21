import { api } from "@/lib/api-client"
import { toast } from "sonner"

export interface Script {
  id: string
  title: string
  content?: string
  tone?: string
  language?: string
  status?: string
  credits_consumed?: number
  created_at: string
  updated_at?: string
  user_id?: string
}

export async function getScripts(): Promise<Script[]> {
  try {
    return await api.get<Script[]>("/api/v1/script", { requireAuth: true })
  } catch {
    toast.error("Failed to load scripts")
    return []
  }
}

export async function updateScript(
  id: string,
  data: Partial<Pick<Script, "title" | "content">>
): Promise<Script | null> {
  try {
    return await api.patch<Script>(`/api/v1/script/${id}`, data, { requireAuth: true })
  } catch {
    return null
  }
}

export async function deleteScript(id: string): Promise<boolean> {
  try {
    await api.delete(`/api/v1/script/${id}`, { requireAuth: true })
    return true
  } catch {
    return false
  }
}
