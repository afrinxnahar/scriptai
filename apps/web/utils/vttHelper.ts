
export function convertJsonToVTT(jsonData: any[]) {
    let vttContent = "WEBVTT\n\n";

    jsonData.forEach((cue, index) => {
        const start = cue.start;
        const end = cue.end;

        vttContent += `${index + 1}\n`;
        vttContent += `${start} --> ${end}\n`;
        vttContent += `${cue.text}\n\n`;
    });

    return vttContent;
}