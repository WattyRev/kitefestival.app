"use client";

import { useState, useCallback, useEffect } from "react";
import { css } from "../../../styled-system/css";

export default function ConfigDataManagement() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");

    // Fetch events on mount
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("/api/events");
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.events);

                    // Set default to active event if any
                    const activeEvent = data.events.find((e) => e.isActive);
                    if (activeEvent) {
                        setSelectedEventId(activeEvent.id);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch events:", e);
            }
        };
        fetchEvents();
    }, []);

    const handleExport = useCallback(async () => {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const url = selectedEventId
                ? `/api/activities?eventId=${selectedEventId}`
                : "/api/activities";
            const res = await fetch(url, { method: "GET" });
            if (!res.ok) throw new Error("Failed to export activities");
            const data = await res.json();

            const exportData = {
                activities: data.activities,
                eventId: selectedEventId,
                exportedAt: new Date().toISOString(),
                eventName: selectedEventId
                    ? events.find((e) => e.id === selectedEventId)?.name
                    : "All Events",
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: "application/json",
            });
            const url2 = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url2;
            const eventName = selectedEventId
                ? events.find((e) => e.id === selectedEventId)?.name
                : "all-events";
            a.download = `activities-export-${eventName}-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url2);
            setSuccess("Exported activities as JSON.");
        } catch (e) {
            setError(e.message || "Export failed");
        } finally {
            setLoading(false);
        }
    }, [selectedEventId, events]);

    // Export all events and their data
    const handleExportAllEvents = useCallback(async () => {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const [eventsRes, activitiesRes] = await Promise.all([
                fetch("/api/events"),
                fetch("/api/activities"),
            ]);

            if (!eventsRes.ok || !activitiesRes.ok)
                throw new Error("Failed to export data");

            const [eventsData, activitiesData] = await Promise.all([
                eventsRes.json(),
                activitiesRes.json(),
            ]);

            const exportData = {
                events: eventsData.events,
                activities: activitiesData.activities,
                exportedAt: new Date().toISOString(),
                version: "1.0",
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `full-export-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            setSuccess("Exported all events and activities as JSON.");
        } catch (e) {
            setError(e.message || "Export failed");
        } finally {
            setLoading(false);
        }
    }, []);

    // Nuke all activities (with admin passcode prompt and confirmation)
    const handleNuke = useCallback(async () => {
        if (
            !window.confirm(
                "Are you sure you want to delete ALL activities? This cannot be undone. A backup will be downloaded first.",
            )
        )
            return;
        let passcode = window.prompt("Enter the ADMIN passcode to confirm:");
        if (!passcode) {
            setError("Nuke cancelled: No passcode provided.");
            return;
        }
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            // Set passcode cookie for this request (expires in 5 minutes)
            document.cookie = `passcode=${encodeURIComponent(passcode)}; path=/; max-age=300`;
            const res = await fetch("/api/activities", {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to nuke activities");
            }
            const data = await res.json();
            // Download snapshot
            const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `activities-snapshot-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            setSuccess("All activities deleted. Snapshot downloaded.");
        } catch (e) {
            setError(e.message || "Nuke failed");
        } finally {
            setLoading(false);
        }
    }, []);

    // Nuke all events and data
    const handleNukeAllEvents = useCallback(async () => {
        if (
            !window.confirm(
                "Are you sure you want to delete ALL EVENTS and their activities? This will delete EVERYTHING. A backup will be downloaded first.",
            )
        )
            return;
        let passcode = window.prompt("Enter the ADMIN passcode to confirm:");
        if (!passcode) {
            setError("Nuke cancelled: No passcode provided.");
            return;
        }
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            // Set passcode cookie for this request (expires in 5 minutes)
            document.cookie = `passcode=${encodeURIComponent(passcode)}; path=/; max-age=300`;
            const res = await fetch("/api/events", {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to nuke all events");
            }
            const data = await res.json();
            // Download snapshot
            const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `full-snapshot-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            setSuccess("All events and data deleted. Snapshot downloaded.");
            setEvents([]);
            setSelectedEventId("");
        } catch (e) {
            setError(e.message || "Nuke failed");
        } finally {
            setLoading(false);
        }
    }, []);

    // Run database migration
    const handleMigration = useCallback(async () => {
        if (
            !window.confirm(
                "This will update your database schema to support the events system. This is generally safe but make sure you have a backup. Continue?",
            )
        )
            return;

        const passcode = window.prompt(
            "Enter the ADMIN passcode to confirm migration:",
        );
        if (!passcode) {
            setError("Migration cancelled: No passcode provided.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");
        try {
            // Set passcode cookie for this request (expires in 5 minutes)
            document.cookie = `passcode=${encodeURIComponent(passcode)}; path=/; max-age=300`;
            const res = await fetch("/api/migrate", {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Migration failed");
            }
            const data = await res.json();
            setSuccess(
                `Migration completed: ${data.message}. Results: ${JSON.stringify(data.migrationResults, null, 2)}`,
            );

            // Refresh events after migration
            const eventsRes = await fetch("/api/events");
            if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                setEvents(eventsData.events);

                // Set default to active event if any
                const activeEvent = eventsData.events.find((e) => e.isActive);
                if (activeEvent) {
                    setSelectedEventId(activeEvent.id);
                }
            }
        } catch (e) {
            setError(e.message || "Migration failed");
        } finally {
            setLoading(false);
        }
    }, []);

    // Import activities from a JSON file
    const handleImport = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            // Handle different import formats
            let activities = [];
            if (importData.activities) {
                activities = importData.activities;
            } else if (Array.isArray(importData)) {
                activities = importData;
            } else {
                throw new Error(
                    "Invalid import format. Expected activities array or object with activities property.",
                );
            }

            // PATCH to /api/activities with activities array
            const res = await fetch("/api/activities", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activities }),
            });
            if (!res.ok) throw new Error("Failed to import activities");
            setSuccess("Imported activities successfully.");
        } catch (e) {
            setError(e.message || "Import failed");
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <section
            className={css({
                bg: "panel.bg",
                border: "1px solid",
                borderColor: "panel.border",
                p: 8,
                borderRadius: "xl",
                maxW: "600px",
                mx: "auto",
                mt: 8,
                boxShadow: "md",
                fontFamily: "inherit",
            })}
        >
            <h2
                className={css({
                    fontSize: "2xl",
                    fontWeight: "semibold",
                    mb: 6,
                    color: "panel.title",
                    letterSpacing: "-0.01em",
                })}
            >
                Data Management
            </h2>

            {/* Event Selection */}
            {events.length > 0 && (
                <div className={css({ mb: 6 })}>
                    <label
                        className={css({
                            display: "block",
                            mb: 2,
                            fontWeight: "medium",
                            color: "gray.700",
                        })}
                    >
                        Export/Import for Event:
                    </label>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className={css({
                            w: "full",
                            p: 2,
                            borderRadius: "md",
                            border: "1px solid",
                            borderColor: "gray.200",
                            bg: "white",
                            fontSize: "md",
                        })}
                    >
                        <option value="">All Events</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.name} {event.isActive ? "(Active)" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div
                className={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                })}
            >
                {/* Single Event Operations */}
                <div
                    className={css({
                        borderBottom: "1px solid",
                        borderColor: "gray.200",
                        pb: 4,
                        mb: 4,
                    })}
                >
                    <h3
                        className={css({
                            fontSize: "lg",
                            fontWeight: "semibold",
                            mb: 3,
                            color: "gray.800",
                        })}
                    >
                        {selectedEventId
                            ? `${events.find((e) => e.id === selectedEventId)?.name || "Selected Event"} Operations`
                            : "All Activities Operations"}
                    </h3>

                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className={css({
                            px: 5,
                            py: 2,
                            borderRadius: "md",
                            border: "1px solid",
                            borderColor: "button.border",
                            bg: "button.bg",
                            color: "button.text",
                            fontWeight: "medium",
                            fontSize: "lg",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 0.2s, border 0.2s",
                            w: "full",
                            mb: 3,
                            _hover: { bg: "button.hoverBg" },
                            _disabled: { opacity: 0.6 },
                        })}
                    >
                        Export Activities (JSON)
                    </button>

                    <label
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                            fontWeight: "medium",
                            color: "gray.700",
                            mb: 3,
                        })}
                    >
                        Import Activities (JSON)
                        <input
                            type="file"
                            accept="application/json"
                            onChange={handleImport}
                            disabled={loading}
                            className={css({
                                p: 1.5,
                                borderRadius: "md",
                                border: "1px solid",
                                borderColor: "gray.200",
                                bg: "gray.50",
                                fontSize: "md",
                            })}
                        />
                    </label>

                    <button
                        onClick={handleNuke}
                        disabled={loading}
                        className={css({
                            px: 5,
                            py: 2,
                            borderRadius: "md",
                            border: "1px solid",
                            borderColor: "red.300",
                            bg: loading ? "red.100" : "red.50",
                            color: "red.700",
                            fontWeight: "semibold",
                            fontSize: "lg",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 0.2s, border 0.2s",
                            w: "full",
                            _hover: { bg: "red.100" },
                            _disabled: { opacity: 0.6 },
                        })}
                    >
                        Nuke All Activities
                    </button>
                </div>

                {/* Global Operations */}
                <div>
                    <h3
                        className={css({
                            fontSize: "lg",
                            fontWeight: "semibold",
                            mb: 3,
                            color: "gray.800",
                        })}
                    >
                        Global Operations
                    </h3>

                    <button
                        onClick={handleMigration}
                        disabled={loading}
                        className={css({
                            px: 5,
                            py: 2,
                            borderRadius: "md",
                            border: "1px solid",
                            borderColor: "purple.300",
                            bg: loading ? "purple.100" : "purple.50",
                            color: "purple.700",
                            fontWeight: "medium",
                            fontSize: "lg",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 0.2s, border 0.2s",
                            w: "full",
                            mb: 3,
                            _hover: { bg: "purple.100" },
                            _disabled: { opacity: 0.6 },
                        })}
                    >
                        🔧 Run Database Migration
                    </button>

                    <button
                        onClick={handleExportAllEvents}
                        disabled={loading}
                        className={css({
                            px: 5,
                            py: 2,
                            borderRadius: "md",
                            border: "1px solid",
                            borderColor: "blue.300",
                            bg: loading ? "blue.100" : "blue.50",
                            color: "blue.700",
                            fontWeight: "medium",
                            fontSize: "lg",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 0.2s, border 0.2s",
                            w: "full",
                            mb: 3,
                            _hover: { bg: "blue.100" },
                            _disabled: { opacity: 0.6 },
                        })}
                    >
                        Export All Events & Activities
                    </button>

                    <button
                        onClick={handleNukeAllEvents}
                        disabled={loading}
                        className={css({
                            px: 5,
                            py: 2,
                            borderRadius: "md",
                            border: "2px solid",
                            borderColor: "red.500",
                            bg: loading ? "red.200" : "red.100",
                            color: "red.800",
                            fontWeight: "bold",
                            fontSize: "lg",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 0.2s, border 0.2s",
                            w: "full",
                            _hover: { bg: "red.200" },
                            _disabled: { opacity: 0.6 },
                        })}
                    >
                        ⚠️ NUKE ALL EVENTS & DATA ⚠️
                    </button>
                </div>

                {loading && (
                    <p
                        className={css({
                            color: "gray.500",
                            m: 0,
                            textAlign: "center",
                            fontStyle: "italic",
                        })}
                    >
                        Processing...
                    </p>
                )}
                {error && (
                    <p
                        className={css({
                            color: "red.700",
                            m: 0,
                            p: 3,
                            bg: "red.50",
                            borderRadius: "md",
                            border: "1px solid",
                            borderColor: "red.200",
                        })}
                    >
                        {error}
                    </p>
                )}
                {success && (
                    <p
                        className={css({
                            color: "green.600",
                            m: 0,
                            p: 3,
                            bg: "green.50",
                            borderRadius: "md",
                            border: "1px solid",
                            borderColor: "green.200",
                        })}
                    >
                        {success}
                    </p>
                )}
            </div>
        </section>
    );
}
