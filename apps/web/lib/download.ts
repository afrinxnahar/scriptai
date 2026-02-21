import { toast } from "sonner";

function triggerDownload(blobUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export async function downloadFile(
  url: string,
  filename: string,
): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    triggerDownload(URL.createObjectURL(blob), filename);
  } catch {
    toast.error(`Failed to download ${filename}`);
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  triggerDownload(URL.createObjectURL(blob), filename);
}
