
export const timeToSeconds = (timeStr: string): number => {
    if (!timeStr || !/^\d\d:\d\d:\d\d\.\d+$/.test(timeStr)) {
        return 0;
    }
    const [h, m, s] = timeStr.split(':');
    const [sec, ms] = s ? s.split('.') : [s, '0'];
    return parseInt(h as string) * 3600 + parseInt(m as string) * 60 + parseInt(sec as string) + parseInt(ms || '0' as string) / 1000;
};

export const secondsToTime = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};