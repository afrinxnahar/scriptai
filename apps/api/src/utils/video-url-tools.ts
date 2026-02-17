export async function fetchVideoAsBuffer(videoUrl: string): Promise<Buffer> {
    if (!videoUrl) throw new Error("Video URL is required");

    const response = await fetch(videoUrl);
    if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Video downloaded as buffer, size:", buffer.length);

    return buffer;
}

export function getFileNameFromUrl(url: string): string {
    try {
        const pathname = new URL(url).pathname;
        const parts = pathname.split("/");
        return parts[parts.length - 1] || `video-${Date.now()}.mp4`;
    } catch {
        return `video-${Date.now()}.mp4`;
    }
}

export function getMimeTypeFromUrl(url: string): string {
    const extension = url.split(".").pop()?.toLowerCase();

    switch (extension) {
        case "mp4":
            return "video/mp4";
        case "mov":
            return "video/quicktime";
        case "webm":
            return "video/webm";
        case "mkv":
            return "video/x-matroska";
        case "avi":
            return "video/x-msvideo";
        default:
            return "application/octet-stream";
    }
}
