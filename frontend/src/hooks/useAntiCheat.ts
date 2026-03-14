import { useEffect, useRef } from 'react';
import type { ViolationType } from '../types/assessment.types';

interface UseAntiCheatProps {
    isActive: boolean;
    onViolation: (type: ViolationType) => void;
}

export function useAntiCheat({ isActive, onViolation }: UseAntiCheatProps) {
    const onViolationRef = useRef(onViolation);

    useEffect(() => {
        onViolationRef.current = onViolation;
    }, [onViolation]);

    useEffect(() => {
        if (!isActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                onViolationRef.current('TAB_SWITCH');
            }
        };

        const handleBlur = () => {
            onViolationRef.current('WINDOW_BLUR');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                onViolationRef.current('FULLSCREEN_EXIT');
                // Attempt force re-enter after a brief pause
                setTimeout(() => {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.warn("Could not auto-resume fullscreen:", err);
                    });
                }, 1000);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const blocked = [
                e.ctrlKey && ['c', 'v', 'a', 'u', 's', 'p'].includes(e.key.toLowerCase()),
                e.key === 'F12',
                e.key === 'F11',
                e.altKey && e.key === 'Tab',
                e.metaKey,
                e.ctrlKey && e.shiftKey && ['i', 'j'].includes(e.key.toLowerCase()),
            ];

            if (blocked.some(Boolean)) {
                e.preventDefault();
                e.stopPropagation();
                onViolationRef.current('KEYBOARD_SHORTCUT');
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            onViolationRef.current('RIGHT_CLICK');
        };

        const handleCopyState = (e: ClipboardEvent) => {
            e.preventDefault();
            onViolationRef.current('COPY_ATTEMPT');
        };

        const handleSelectStart = (_e: Event) => {
            // e.preventDefault();
            // Note: Preventing selectstart can break accessibility and legit form inputs
            // Muted unless strictly required, but usually 'COPY_ATTEMPT' is enough.
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);

        ['copy', 'paste', 'cut'].forEach(event => {
            document.addEventListener(event, handleCopyState as EventListener);
        });

        document.addEventListener('selectstart', handleSelectStart);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);

            ['copy', 'paste', 'cut'].forEach(event => {
                document.removeEventListener(event, handleCopyState as EventListener);
            });
            document.removeEventListener('selectstart', handleSelectStart);
        };
    }, [isActive]);
}
