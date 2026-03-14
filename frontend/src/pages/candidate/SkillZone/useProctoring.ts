import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs-core';
// Import WebGL backend so tf.browser computations work
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import type { FaceLandmarksDetector } from '@tensorflow-models/face-landmarks-detection';

export type ViolationType = {
    id: string;
    type: 'visual' | 'audio' | 'environment';
    message: string;
    timestamp: number;
};

interface ProctoringState {
    status: 'initializing' | 'active' | 'error';
    activeViolation: ViolationType | null;
    violationLog: ViolationType[];
    audioLevels: number[]; // 5 bars
}

const GLOBAL_COOLDOWN_MS = 8000;
const MODAL_DISPLAY_MS = 6000;
const AUDIO_THRESHOLD = 30; // 0-255 scale


export const useProctoring = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
    const [state, setState] = useState<ProctoringState>({
        status: 'initializing',
        activeViolation: null,
        violationLog: [],
        audioLevels: [20, 40, 60, 40, 20]
    });

    const isRunningRef = useRef(false);
    const lastViolationTimeRef = useRef(0);
    const detectorRef = useRef<FaceLandmarksDetector | null>(null);

    // Audio Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);

    const checkCooldown = () => {
        const now = Date.now();
        if (now - lastViolationTimeRef.current > GLOBAL_COOLDOWN_MS) {
            lastViolationTimeRef.current = now;
            return true; // We can show a new violation
        }
        return false;
    };

    const triggerViolation = useCallback((type: 'visual' | 'audio' | 'environment', message: string) => {
        if (!checkCooldown()) return;

        const newViolation: ViolationType = {
            id: Math.random().toString(36).substring(7),
            type,
            message,
            timestamp: Date.now()
        };

        setState(prev => ({
            ...prev,
            activeViolation: newViolation,
            violationLog: [newViolation, ...prev.violationLog]
        }));

        // Auto-dismiss after 6s
        setTimeout(() => {
            setState(prev => {
                if (prev.activeViolation?.id === newViolation.id) {
                    return { ...prev, activeViolation: null };
                }
                return prev;
            });
        }, MODAL_DISPLAY_MS);
    }, []);

    // 1. TensorFlow FaceMesh Engine
    useEffect(() => {
        let animationFrameId: number;

        const initTF = async () => {
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                
                const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
                const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
                    runtime: 'tfjs',
                    refineLandmarks: true, // Need this for iris (gaze) tracking
                };
                
                detectorRef.current = await faceLandmarksDetection.createDetector(model, detectorConfig);
                setState(prev => ({ ...prev, status: 'active' }));
                isRunningRef.current = true;
                runPredictionLoop();
            } catch (err) {
                console.error("TF Engine Failed to Init:", err);
                setState(prev => ({ ...prev, status: 'error' }));
            }
        };

        const checkGaze = (face: faceLandmarksDetection.Face) => {
            // Very simplified gaze calculation based on bounding box / iris centers.
            // Normally, you measure distance from keypoints 468 (iris center) to eye corners (33, 133).
            // Here we do a basic boundary check for demonstration.
            if (!face.keypoints) return;
            // The refinement adds irises at the end of the keypoint array (468-477)
            const leftIris = face.keypoints.find(k => k.name === 'leftIris');
            const rightIris = face.keypoints.find(k => k.name === 'rightIris');
            
            if (leftIris && rightIris) {
                // To do high fidelity gaze tracking, you'd compute ratios of iris x/y against eye bounding box.
                // For this implementation, we will assume detection proves functionality, and mock aggressive thresholds.
                const eyeDiff = Math.abs(leftIris.x - rightIris.x);
                if (eyeDiff < 10) { // Highly abnormal (looking drastically away / false detection)
                    triggerViolation('visual', 'Eye gaze deviation detected. Please look at the screen.');
                }
            }
        };

        const runPredictionLoop = async () => {
            if (!isRunningRef.current || !videoRef.current || !detectorRef.current) return;
            
            const video = videoRef.current;
            if (video.readyState >= 2) {
                try {
                    const estimationConfig = {flipHorizontal: false};
                    const faces = await detectorRef.current.estimateFaces(video, estimationConfig);

                    if (faces.length === 0) {
                        triggerViolation('visual', 'Face not detected in frame.');
                    } else if (faces.length > 1) {
                        triggerViolation('visual', 'Multiple faces detected in frame.');
                    } else {
                        checkGaze(faces[0]);
                    }
                } catch (e) {
                    console.error("Face estimation error:", e);
                }
            }

            // Run at ~3 FPS (every ~333ms)
            setTimeout(() => {
                animationFrameId = requestAnimationFrame(runPredictionLoop);
            }, 300);
        };

        initTF();

        return () => {
            isRunningRef.current = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (detectorRef.current) detectorRef.current.dispose();
        };
    }, [videoRef, triggerViolation]);

    // 2. Audio & Video API Engine
    useEffect(() => {
        let audioFrameId: number;

        const initMedia = async () => {
            try {
                audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
                    audio: true, 
                    video: { width: 320, height: 240 } 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = audioStreamRef.current;
                }

                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                
                const source = audioContextRef.current.createMediaStreamSource(audioStreamRef.current);
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                source.connect(analyserRef.current);

                pollAudio();
            } catch (err) {
                console.error("Mic/Cam access denied or failed", err);
            }
        };

        const pollAudio = () => {
            if (!analyserRef.current || !isRunningRef.current) return;
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length);

            // Animate EQ bars
            const newLevels = [
                Math.min(100, rms * 1.5),
                Math.min(100, rms * 2.2),
                Math.min(100, rms * 1.8),
                Math.min(100, rms * 2.5),
                Math.min(100, rms * 1.2)
            ].map(v => Math.max(10, v)); // Minimum height

            setState(prev => ({ ...prev, audioLevels: newLevels }));

            if (rms > AUDIO_THRESHOLD) {
                triggerViolation('audio', 'High ambient noise or conversation detected.');
            }

            // Sample audio less frequently than visuals, ~every 250ms
            setTimeout(() => {
                audioFrameId = requestAnimationFrame(pollAudio);
            }, 250);
        };

        // Call initMedia asynchronously immediately on mount
        initMedia();

        return () => {
            if (audioFrameId) cancelAnimationFrame(audioFrameId);
            if (audioContextRef.current) audioContextRef.current.close();
            if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(t => t.stop());
        };
    }, [triggerViolation]);

    // 3. Environment Fullscreen & Tab Tracking
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerViolation('environment', 'Tab switched or minimized.');
            }
        };

        const handleBlur = () => {
            triggerViolation('environment', 'Browser window lost focus.');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                triggerViolation('environment', 'Exited fullscreen mode.');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [triggerViolation]);

    return {
        ...state
    };
};
