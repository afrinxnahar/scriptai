export type SubtitleResponse = {
    id: string;
    user_id: string;
    video_path: string;
    video_url: string;
    subtitles_json: string;
    status: "done" | "queued" | "processing" | "failed";
    target_language: string;
    detected_language: string;
    language: string;
    duration: string;
    error_message: string;
    created_at: string;
    updated_at: string;
    filename: string;

};