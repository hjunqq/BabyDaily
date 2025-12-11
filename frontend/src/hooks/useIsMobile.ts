import { useEffect, useState } from 'react';

// Detect viewport breakpoint to choose mobile vs desktop rendering
export const useIsMobile = (breakpoint = 900) => {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [breakpoint]);

    return isMobile;
};
