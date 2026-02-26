import type { SubtitleLine } from "@repo/validation";

export function convertJsonToVTT(jsonData: SubtitleLine[]): string {
  if (!Array.isArray(jsonData) || jsonData.length === 0) return "WEBVTT\n\n";
  return "WEBVTT\n\n" + jsonData
    .map((cue, i) => `${i + 1}\n${cue.start} --> ${cue.end}\n${cue.text}\n\n`)
    .join("");
}