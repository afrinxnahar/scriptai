import { api } from "@/lib/api-client"
import { DubResponse } from "@repo/validation"

export interface DubbingProject {
  id: string
  project_id: string
  user_id: string
  original_media_url: string
  target_language: string
  status: "dubbing" | "dubbed"
  is_video: boolean
  dubbedUrl?: string
  credits_consumed?: number
  created_at: string
  media_name?: string
}

export async function getDubbings(accessToken?: string): Promise<DubbingProject[]> {
  try {
    return await api.get<DubbingProject[]>("/api/v1/dubbing", {
      requireAuth: true,
      accessToken,
    })
  } catch (error) {
    console.error("Error fetching dubbings:", error)
    return []
  }
}

export async function getDubbing(
  projectId: string,
  accessToken?: string
): Promise<DubResponse | null> {
  try {
    return await api.get<DubResponse>(`/api/v1/dubbing/${projectId}`, {
      requireAuth: true,
      accessToken,
    })
  } catch (error) {
    console.error(`Error fetching dubbing ${projectId}:`, error)
    return null
  }
}

export async function deleteDubbing(
  projectId: string,
  accessToken?: string
): Promise<boolean> {
  try {
    await api.delete(`/api/v1/dubbing/${projectId}`, {
      requireAuth: true,
      accessToken,
    })
    return true
  } catch (error) {
    console.error(`Error deleting dubbing ${projectId}:`, error)
    return false
  }
}

