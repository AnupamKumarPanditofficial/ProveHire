import { useEffect, useRef, useState, useCallback } from 'react';
import { astraCheckFace } from '../services/geminiAssessment';

interface UseProctoringProps {
    onViolation: (type: 'NO_FACE' | 'MULTIPLE_FACES' | 'LOOKING_AWAY') => void;
    isActive: boolean;
    intervalMs?: number;
}

export function useProctoring({ onViolation, isActive, intervalMs = 10000 }: UseProctoringProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);
    const onViolationRef = useRef(onViolation);

    useEffect(() => {
        onViolationRef.current = onViolation;
    }, [onViolation]);

    const requestCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 }
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to be ready before playing
                await videoRef.current.play().catch(e => console.warn("Video play interrupted:", e));
            }
            setCameraAllowed(true);
            return true;
        } catch (err) {
            console.error("Camera access denied or failed:", err);
            setCameraAllowed(false);
            return false;
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraAllowed(false);
    }, []);

    // Snap and send frames to Gemini periodically when active
    useEffect(() => {
        if (!isActive || !cameraAllowed || !videoRef.current) return;

        const captureAndCheck = async () => {
            const video = videoRef.current;
            if (!video || video.videoWidth === 0) return;

            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Draw current video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Extract base64 without data URI prefix for Gemini API payload
            const base64Str = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

            try {
                const result = await astraCheckFace(base64Str);

                if (!result.faceDetected) {
                    onViolationRef.current('NO_FACE');
                } else if (result.multipleFaces) {
                    onViolationRef.current('MULTIPLE_FACES');
                } else if (result.lookingAway) {
                    onViolationRef.current('LOOKING_AWAY');
                }
            } catch (error) {
                console.warn("Face check check failure (ignored):", error);
            }
        };

        const intervalId = setInterval(captureAndCheck, intervalMs);
        return () => clearInterval(intervalId);
    }, [isActive, cameraAllowed, intervalMs]);

    // Safety cleanup on unmount
    useEffect(() => {
        return stopCamera;
    }, [stopCamera]);

    return {
        videoRef,
        cameraAllowed,
        requestCamera,
        stopCamera
    };
}
