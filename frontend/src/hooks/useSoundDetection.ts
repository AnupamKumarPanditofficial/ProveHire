import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to manage sound detection context
 */
export function useSoundDetection() {
    const [audioAllowed, setAudioAllowed] = useState<boolean | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const requestAudio = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AudioContextCls = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextCls();
            audioContextRef.current = audioCtx;

            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            setAudioAllowed(true);
            return true;
        } catch (err) {
            console.error("Audio permission denied", err);
            setAudioAllowed(false);
            return false;
        }
    }, []);

    const stopAudio = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        setAudioAllowed(false);
    }, []);

    const checkNoiseLevel = useCallback((): boolean => {
        if (!analyserRef.current) return false;

        const analyser = analyserRef.current;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Calculate peak amplitude rather than spreading across 256 bins (which dilutes speech/music)
        const peakAmplitude = Math.max(...Array.from(dataArray));

        // Peak goes from 0 to 255. 120 is about 47% volume on a single frequency band.
        return peakAmplitude > 120;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return stopAudio;
    }, [stopAudio]);

    return {
        audioAllowed,
        requestAudio,
        stopAudio,
        checkNoiseLevel
    };
}
