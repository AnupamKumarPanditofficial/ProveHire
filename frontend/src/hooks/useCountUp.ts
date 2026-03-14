import { useState, useEffect } from 'react';

function useCountUp(target: number, duration = 1200): number {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (target === 0) {
            setCurrent(0);
            return;
        }
        let startTime: number | null = null;
        const startValue = 0;

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.floor(startValue + eased * (target - startValue)));
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                setCurrent(target);
            }
        };

        const rafId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafId);
    }, [target, duration]);

    return current;
}

export default useCountUp;
