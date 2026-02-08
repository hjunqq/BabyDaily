import { useEffect, useState } from 'react';

// Detect viewport breakpoint to choose mobile vs desktop rendering
export const useIsMobile = (breakpoint = 1024) => {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const update = () => {
            const ua = navigator.userAgent || '';
            const isIOSiPad = /iPad/i.test(ua);
            const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
            const isiPadFamily = isIOSiPad || isTouchMac;
            setIsMobile(mq.matches || isiPadFamily);
        };
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [breakpoint]);

    return isMobile;
};
