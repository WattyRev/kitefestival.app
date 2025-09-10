import { useEffect, useState } from "react";

function formatDuration(seconds) {
    let interval = seconds / 31536000;
    if (interval >= 1) {
        const v = Math.floor(interval);
        return `${v} year${v === 1 ? "" : "s"}`;
    }
    interval = seconds / 2592000;
    if (interval >= 1) {
        const v = Math.floor(interval);
        return `${v} month${v === 1 ? "" : "s"}`;
    }
    interval = seconds / 86400;
    if (interval >= 1) {
        const v = Math.floor(interval);
        return `${v} day${v === 1 ? "" : "s"}`;
    }
    interval = seconds / 3600;
    if (interval >= 1) {
        const v = Math.floor(interval);
        return `${v} hour${v === 1 ? "" : "s"}`;
    }
    interval = seconds / 60;
    if (interval >= 1) {
        const v = Math.floor(interval);
        return `${v} minute${v === 1 ? "" : "s"}`;
    }
    const v = Math.floor(seconds);
    return `${v} second${v === 1 ? "" : "s"}`;
}

function timeSince(date) {
    let seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    // If the timestamp is in the future (clock skew / timezone issues), clamp to 0
    if (seconds < 0) seconds = 0;
    const phrase = formatDuration(seconds);
    return `${phrase} ago`;
}

const TimeAgo = ({ timestamp, live = true, ...props }) => {
    const dateTime = new Date(timestamp);
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        if (!live) return; // Do not auto-update when live is false
        let cancelled = false;
        function schedule() {
            const now = Date.now();
            let seconds = Math.floor((now - dateTime.getTime()) / 1000);
            if (seconds < 0) seconds = 0;
            let delay = 1000; // default 1s for first minute
            if (seconds < 60) {
                delay = 1000; // update every second under a minute
            } else if (seconds < 3600) {
                // update at the next minute boundary
                const nextMinute = (Math.floor(seconds / 60) + 1) * 60;
                delay = (nextMinute - seconds) * 1000;
            } else if (seconds < 86400) {
                // hourly updates
                const nextHour = (Math.floor(seconds / 3600) + 1) * 3600;
                delay = (nextHour - seconds) * 1000;
            } else {
                // daily updates
                const nextDay = (Math.floor(seconds / 86400) + 1) * 86400;
                delay = (nextDay - seconds) * 1000;
            }
            // Cap delay to 24h to avoid extremely long timers
            delay = Math.min(delay, 24 * 3600 * 1000);
            const id = setTimeout(() => {
                if (cancelled) return;
                forceUpdate((c) => c + 1);
                schedule();
            }, delay);
            return () => clearTimeout(id);
        }
        const cleanup = schedule();
        return () => {
            cancelled = true;
            if (typeof cleanup === "function") cleanup();
        };
    }, [timestamp, live]);

    return <em {...props} title={dateTime.toLocaleString()}>{timeSince(dateTime)}</em>;
};

export default TimeAgo;
