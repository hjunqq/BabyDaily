import { useEffect, useState } from 'react';

export const KindleSessionManager = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showRefresh, setShowRefresh] = useState(false);

    // Check if we're in Kindle mode
    const isKindleMode = typeof document !== 'undefined' && document.body.classList.contains('kindle-mode');

    useEffect(() => {
        if (!isKindleMode) return;

        // Monitor online/offline status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic API health check (every 2 minutes)
        const healthCheckInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/health', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                setIsOnline(response.ok);
            } catch (error) {
                setIsOnline(false);
            }
        }, 2 * 60 * 1000);

        // Periodic screen refresh (every 5 minutes) to prevent e-ink burn-in
        const getLastRefreshTime = () => {
            const stored = localStorage.getItem('kindle-last-refresh');
            return stored ? parseInt(stored, 10) : Date.now();
        };

        const setLastRefreshTime = (time: number) => {
            localStorage.setItem('kindle-last-refresh', time.toString());
        };

        const triggerScreenRefresh = () => {
            setShowRefresh(true);
            setLastRefreshTime(Date.now());

            // Hide refresh overlay after animation completes
            setTimeout(() => {
                setShowRefresh(false);
            }, 1000);
        };

        // Check if we need to refresh on mount
        const lastRefresh = getLastRefreshTime();
        const timeSinceRefresh = Date.now() - lastRefresh;
        const refreshInterval = 5 * 60 * 1000; // 5 minutes

        if (timeSinceRefresh >= refreshInterval) {
            // Trigger refresh after a short delay to let page load
            setTimeout(triggerScreenRefresh, 2000);
        }

        // Set up periodic refresh timer
        const timeUntilNextRefresh = refreshInterval - (timeSinceRefresh % refreshInterval);
        const refreshTimer = setTimeout(() => {
            triggerScreenRefresh();

            // Set up recurring refresh
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
            {/* Online/Offline Indicator */}
            <div
                className="kindle-online-indicator"
                title={isOnline ? 'Online' : 'Offline - Please refresh browser'}
            >
                <div className={`indicator-dot ${isOnline ? 'online' : 'offline'}`} />
                {!isOnline && <span className="offline-text">📡</span>}
            </div>

            {/* Screen Refresh Overlay */}
            {showRefresh && (
                <div className="kindle-refresh-overlay" />
            )}
        </>
    );
};
