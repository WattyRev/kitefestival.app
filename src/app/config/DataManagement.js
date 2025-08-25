"use client";

import { useState, useCallback, useEffect } from "react";
import { css } from "../../../styled-system/css";
import { useEvents } from "../../components/EventsContext";

export default function ConfigDataManagement() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const { refreshEvents: refreshGlobalEvents } = useEvents();

    // Fetch events on mount
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("/api/events", { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.events);

                    const activeEvent = data.events.find((e) => e.isActive);
                    if (activeEvent) setSelectedEventId(activeEvent.id);
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
            const res = await fetch(url, { method: "GET", credentials: "include" });
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

    // Import activities from a JSON file (activities array or { activities })
    const handleImport = useCallback(
        async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            setLoading(true);
            setError("");
            setSuccess("");
            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                let activities = [];
                if (importData.activities) activities = importData.activities;
                else if (Array.isArray(importData)) activities = importData;
                else throw new Error("Invalid import format. Expected activities array or object with activities property.");

                const res = await fetch("/api/activities", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ activities }),
                });
                if (!res.ok) throw new Error("Failed to import activities");
                setSuccess("Imported activities successfully.");
                try {
                    await refreshGlobalEvents();
                } catch {}
            } catch (e) {
                setError(e.message || "Import failed");
            } finally {
                setLoading(false);
                if (event?.target) event.target.value = "";
            }
        },
        [refreshGlobalEvents],
    );

    // Import a full exported dataset or single-event export
    const handleImportExported = useCallback(
        async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            setLoading(true);
            setError("");
            setSuccess("");
            try {
                const text = await file.text();
                const importData = JSON.parse(text);

                let eventsPayload = [];
                let activitiesPayload = [];
                let singleEventIdFromFile = undefined;
                let singleEventNameFromFile = undefined;

                if (Array.isArray(importData)) {
                    activitiesPayload = importData;
                } else if (importData && typeof importData === "object") {
                    if (Array.isArray(importData.events) && Array.isArray(importData.activities)) {
                        eventsPayload = importData.events;
                        activitiesPayload = importData.activities;
                    } else if (Array.isArray(importData.activities)) {
                        activitiesPayload = importData.activities;
                        singleEventIdFromFile = importData.eventId;
                        singleEventNameFromFile = importData.eventName;
                    }
                }

                if (!Array.isArray(activitiesPayload) || activitiesPayload.length === 0) {
                    throw new Error("Invalid export file. Provide activities array or a full export with events and activities.");
                }

                const passcode = window.prompt("Enter the EDITOR passcode to import exported data:");
                if (!passcode) {
                    setError("Import cancelled: No passcode provided.");
                    return;
                }
                document.cookie = `passcode=${encodeURIComponent(passcode)}; path=/; max-age=300`;

                const existingRes = await fetch("/api/events", { credentials: "include" });
                const existing = existingRes.ok ? await existingRes.json() : { events: [] };
                const existingByName = new Map(existing.events.map((e) => [String(e.name).toLowerCase(), e.id]));
                const existingById = new Set(existing.events.map((e) => e.id));

                const oldToNewId = {};

                if (Array.isArray(eventsPayload) && eventsPayload.length) {
                    for (const ev of eventsPayload) {
                        const nameKey = String(ev.name || "").toLowerCase();
                        if (!nameKey) continue;
                        let targetId = existingByName.get(nameKey);
                        if (!targetId) {
                            const res = await fetch("/api/events", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({
                                    name: ev.name,
                                    description: ev.description ?? "",
                                    startDate: ev.startDate ?? null,
                                    endDate: ev.endDate ?? null,
                                    location: ev.location ?? "",
                                }),
                            });
                            if (!res.ok) {
                                const data = await res.json().catch(() => ({}));
                                throw new Error(data.message || `Failed to create event '${ev.name}'`);
                            }
                            const body = await res.json();
                            targetId = body?.event?.id;
                            if (targetId) existingByName.set(nameKey, targetId);
                        }
                        if (ev.id && targetId) oldToNewId[ev.id] = targetId;
                    }
                }

                let defaultTargetEventId = undefined;
                if (!Array.isArray(eventsPayload) || eventsPayload.length === 0) {
                    if (singleEventIdFromFile && existingById.has(singleEventIdFromFile)) {
                        defaultTargetEventId = singleEventIdFromFile;
                    } else if (singleEventNameFromFile) {
                        const nameKey = String(singleEventNameFromFile).toLowerCase();
                        defaultTargetEventId = existingByName.get(nameKey);
                        if (!defaultTargetEventId && nameKey) {
                            const res = await fetch("/api/events", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ name: singleEventNameFromFile, description: "" }),
                            });
                            if (res.ok) {
                                const body = await res.json();
                                defaultTargetEventId = body?.event?.id;
                            }
                        }
                    }
                    if (!defaultTargetEventId && selectedEventId) defaultTargetEventId = selectedEventId;
                    if (!defaultTargetEventId) {
                        const active = existing.events.find((e) => e.isActive);
                        if (active) defaultTargetEventId = active.id;
                    }
                }

                const activities = (activitiesPayload || []).map((a) => ({
                    ...a,
                    eventId:
                        (a && a.eventId && oldToNewId[a.eventId]) ||
                        a.eventId ||
                        defaultTargetEventId ||
                        selectedEventId ||
                        null,
                }));

                const resPatch = await fetch("/api/activities", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ activities }),
                });
                if (!resPatch.ok) {
                    const data = await resPatch.json().catch(() => ({}));
                    throw new Error(data.message || "Failed to import activities");
                }

                setSuccess("Imported exported data (events and activities) successfully.");

                const refreshRes = await fetch("/api/events", { credentials: "include" });
                if (refreshRes.ok) {
                    const refreshed = await refreshRes.json();
                    setEvents(refreshed.events);
                }
                try {
                    await refreshGlobalEvents();
                } catch {}
            } catch (e) {
                setError(e.message || "Import failed");
            } finally {
                setLoading(false);
                if (event?.target) event.target.value = "";
            }
        },
        [selectedEventId, refreshGlobalEvents],
    );

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

            {events.length > 0 && (
                <div className={css({ mb: 6 })}>
                    <label
                        className={css({ display: "block", mb: 2, fontWeight: "medium", color: "gray.700" })}
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

            <div className={css({ display: "flex", flexDirection: "column", gap: 5 })}>
                <div className={css({ borderBottom: "1px solid", borderColor: "gray.200", pb: 4, mb: 4 })}>
                    <h3 className={css({ fontSize: "lg", fontWeight: "semibold", mb: 3, color: "gray.800" })}>
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
                        className={css({ display: "flex", flexDirection: "column", gap: 1.5, fontWeight: "medium", color: "gray.700", mb: 3 })}
                    >
                        Import Activities (JSON)
                        <input
                            type="file"
                            accept="application/json"
                            onChange={handleImport}
                            disabled={loading}
                            className={css({ p: 1.5, borderRadius: "md", border: "1px solid", borderColor: "gray.200", bg: "gray.50", fontSize: "md" })}
                        />
                    </label>
                </div>

                <div>
                    <label
                        className={css({ display: "flex", flexDirection: "column", gap: 1.5, fontWeight: "medium", color: "gray.700", mb: 3 })}
                    >
                        Import Exported Data (events + activities)
                        <input
                            type="file"
                            accept="application/json"
                            onChange={handleImportExported}
                            disabled={loading}
                            className={css({ p: 1.5, borderRadius: "md", border: "1px solid", borderColor: "gray.200", bg: "gray.50", fontSize: "md" })}
                        />
                    </label>
                </div>

                {loading && (
                    <p className={css({ color: "gray.500", m: 0, textAlign: "center", fontStyle: "italic" })}>
                        Processing...
                    </p>
                )}
                {error && (
                    <p className={css({ color: "red.700", m: 0, p: 3, bg: "red.50", borderRadius: "md", border: "1px solid", borderColor: "red.200" })}>
                        {error}
                    </p>
                )}
                {success && (
                    <p className={css({ color: "green.600", m: 0, p: 3, bg: "green.50", borderRadius: "md", border: "1px solid", borderColor: "green.200" })}>
                        {success}
                    </p>
                )}
            </div>
        </section>
    );
}
