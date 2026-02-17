import { useState, useCallback, useRef, useEffect } from 'react';
import { SubtitleLine } from '@repo/validation';
import { useDebounce } from './useDebounce';

interface UndoRedoState {
    history: SubtitleLine[][];
    currentIndex: number;
}

const MAX_HISTORY_SIZE = 50;
const DEBOUNCE_DELAY = 300;

/**
 * Deep equality check for subtitle arrays
 */
function areSubtitlesEqual(a: SubtitleLine[], b: SubtitleLine[]): boolean {
    if (a.length !== b.length) return false;

    return a.every((subtitle, index) => {
        const other = b[index];
        return (
            subtitle.start === other?.start &&
            subtitle.end === other?.end &&
            subtitle.text === other?.text
        );
    });
}

export function useUndoRedo(
    subtitles: SubtitleLine[],
    setSubtitles: (subtitles: SubtitleLine[]) => void
) {
    const [state, setState] = useState<UndoRedoState>({
        history: [subtitles],
        currentIndex: 0
    });


    const isNavigatingRef = useRef(false);


    const lastRecordedRef = useRef<SubtitleLine[]>(subtitles);


    const debouncedSubtitles = useDebounce(subtitles, DEBOUNCE_DELAY);

    useEffect(() => {

        if (isNavigatingRef.current) {
            isNavigatingRef.current = false;
            return;
        }


        if (debouncedSubtitles.length === 0 && lastRecordedRef.current.length === 0) {
            return;
        }


        if (areSubtitlesEqual(debouncedSubtitles, lastRecordedRef.current)) {
            return;
        }


        setState(prevState => {
            const { history, currentIndex } = prevState;


            const newHistory = history.slice(0, currentIndex + 1);


            newHistory.push(debouncedSubtitles);


            const trimmedHistory = newHistory.length > MAX_HISTORY_SIZE
                ? newHistory.slice(newHistory.length - MAX_HISTORY_SIZE)
                : newHistory;

            return {
                history: trimmedHistory,
                currentIndex: trimmedHistory.length - 1
            };
        });

        lastRecordedRef.current = debouncedSubtitles;
    }, [debouncedSubtitles]);

    const undo = useCallback(() => {
        setState(prevState => {
            const { history, currentIndex } = prevState;

            if (currentIndex <= 0) return prevState;

            const newIndex = currentIndex - 1;
            const previousState = history[newIndex];
            if (!previousState) return prevState;

            isNavigatingRef.current = true;


            lastRecordedRef.current = previousState;
            setSubtitles(previousState);

            return {
                ...prevState,
                currentIndex: newIndex
            };
        });
    }, [setSubtitles]);

    const redo = useCallback(() => {
        setState(prevState => {
            const { history, currentIndex } = prevState;

            if (currentIndex >= history.length - 1) return prevState;

            const newIndex = currentIndex + 1;
            const nextState = history[newIndex];
            if (!nextState) return prevState;

            isNavigatingRef.current = true;


            lastRecordedRef.current = nextState;
            setSubtitles(nextState);

            return {
                ...prevState,
                currentIndex: newIndex
            };
        });
    }, [setSubtitles]);

    const clear = useCallback(() => {
        setState({
            history: [subtitles],
            currentIndex: 0
        });
        lastRecordedRef.current = subtitles;
    }, [subtitles]);

    return {
        undo,
        redo,
        clear,
        canUndo: state.currentIndex > 0,
        canRedo: state.currentIndex < state.history.length - 1,
        historySize: state.history.length,
        currentIndex: state.currentIndex
    };
}