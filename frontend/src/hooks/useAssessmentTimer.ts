import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAssessmentTimerProps {
    initialQuestionTime: number; // usually 40 seconds
    onTimeUp: () => void;
    isActive: boolean;
}

export function useAssessmentTimer({ initialQuestionTime, onTimeUp, isActive }: UseAssessmentTimerProps) {
    const [questionTimer, setQuestionTimer] = useState(initialQuestionTime);
    const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
    const onTimeUpRef = useRef(onTimeUp);

    // Keep ref fresh so interval doesn't closure-trap an old function
    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setTotalTimeElapsed(prev => prev + 1);

            setQuestionTimer(prev => {
                if (prev <= 1) {
                    onTimeUpRef.current();
                    return initialQuestionTime;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, initialQuestionTime]);

    const resetQuestionTimer = useCallback(() => {
        setQuestionTimer(initialQuestionTime);
    }, [initialQuestionTime]);

    return {
        questionTimer,
        totalTimeElapsed,
        resetQuestionTimer
    };
}
