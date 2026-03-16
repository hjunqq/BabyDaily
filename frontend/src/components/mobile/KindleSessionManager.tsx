import { useEffect, useState } from 'react';

export const KindleSessionManager = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showRefresh, setShowRefresh] = useState(false);

    const isKindleMode = typeof document !== 'undefined' && document.body.classList.contains('kindle-mode');

    useEffect(() => {
        if (!isKindleMode) return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Health check every 5 minutes (only when page is visible)
        const healthCheckInterval = setInterval(async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const response = await fetch('/api/health', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                setIsOnline(response.ok);
            } catch {
                setIsOnline(false);
            }
        }, 5 * 60 * 1000);

        // Screen refresh every 10 minutes to prevent e-ink burn-in
        const getLastRefreshTime = () => {
            const stored = localStorage.getItem('kindle-last-refresh');
            return stored ? parseInt(stored, 10) : Date.now();
        };

        const setLastRefreshTime = (time: number) => {
            localStorage.setItem('kindle-last-refresh', time.toString());
        };

        const triggerScreenRefresh = () => {
            if (document.visibilityState !== 'visible') return;
            setShowRefresh(true);
            setLastRefreshTime(Date.now());
            setTimeout(() => setShowRefresh(false), 1000);
        };

        const lastRefresh = getLastRefreshTime();
        const timeSinceRefresh = Date.now() - lastRefresh;
        const refreshInterval = 10 * 60 * 1000; // 10 minutes

        if (timeSinceRefresh >= refreshInterval) {
            setTimeout(triggerScreenRefresh, 2000);
        }

        const timeUntilNextRefresh = refreshInterval - (timeSinceRefresh % refreshInterval);
        const refreshTimer = setTimeout(() => {
            triggerScreenRefresh();
            const recurringRefresh = setInterval(triggerScreenRefresh, refreshInterval);
            return () => clearInterval(recurringRefresh);
        }, timeUntilNextRefresh);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(healthCheckInterval);
            clearTimeout(refreshTimer);
        };
    }, [isKindleMode]);

    if (!isKindleMode) return null;

    return (
        <>
            <div
                className="kindle-online-indicator"
                title={isOnline ? 'Online' : 'Offline - Please refresh browser'}
            >
                <div className={`indicator-dot ${isOnline ? 'online' : 'offline'}`} />
                {!isOnline && <span className="offline-text">offline</span>}
            </div>

            {showRefresh && (
                <div className="kindle-refresh-overlay" />
            )}
        </>
    );
};
