"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import fetch from "../util/fetch";

export const EventsContext = createContext({
    events: [],
    activeEvent: null,
    isLoading: false,
    error: null,
    refreshEvents: () => {},
    setActiveEvent: () => {},
});

export const useEvents = () => {
    const context = useContext(EventsContext);
    if (!context) {
        throw new Error("useEvents must be used within an EventsProvider");
    }
    return context;
};

export function EventsProvider({ children }) {
    const [events, setEvents] = useState([]);
    const [activeEvent, setActiveEventState] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const refreshEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/events");
            if (!response.ok) {
                throw new Error("Failed to fetch events");
            }
            const data = await response.json();
            setEvents(data.events);

            // Find and set active event
            const active = data.events.find((event) => event.isActive);
            setActiveEventState(active || null);
        } catch (err) {
            console.error("Error fetching events:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setActiveEvent = useCallback(async (eventId) => {
        if (!eventId) {
            setActiveEventState(null);
            return;
        }

        try {
            const response = await fetch(`/api/events/${eventId}/activate`, {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to activate event");
            }

            const data = await response.json();

            // Update events list - deactivate all others, activate this one
            setEvents((prev) =>
                prev.map((event) => ({
                    ...event,
                    isActive: event.id === eventId,
                })),
            );

            setActiveEventState(data.activeEvent);
        } catch (err) {
            console.error("Error activating event:", err);
            setError(err.message);
        }
    }, []);

    // Load events on mount
    useEffect(() => {
        refreshEvents();
    }, [refreshEvents]);

    const value = useMemo(
        () => ({
            events,
            activeEvent,
            isLoading,
            error,
            refreshEvents,
            setActiveEvent,
        }),
        [events, activeEvent, isLoading, error, refreshEvents, setActiveEvent],
    );

    return (
        <EventsContext.Provider value={value}>
            {children}
        </EventsContext.Provider>
    );
}
