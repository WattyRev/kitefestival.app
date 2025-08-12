"use client";

import { useEvents } from "./EventsContext";
import { css } from "../../styled-system/css";

export default function EventSelector() {
    const { events, activeEvent, setActiveEvent, isLoading } = useEvents();

    if (events.length === 0) {
        return null; // Don't show if no events exist
    }

    return (
        <div
            className={css({
                position: "fixed",
                top: "20px",
                right: "20px",
                zIndex: 1000,
                backgroundColor: "white",
                border: "2px solid",
                borderColor: activeEvent ? "blue.300" : "gray.300",
                borderRadius: "8px",
                padding: "12px",
                boxShadow: "lg",
                minWidth: "200px",
            })}
        >
            <div
                className={css({
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "gray.600",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                })}
            >
                Current Event
            </div>

            {activeEvent ? (
                <div>
                    <div
                        className={css({
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "blue.800",
                            marginBottom: "4px",
                        })}
                    >
                        🎪 {activeEvent.name}
                    </div>
                    {activeEvent.description && (
                        <div
                            className={css({
                                fontSize: "12px",
                                color: "gray.600",
                                marginBottom: "8px",
                            })}
                        >
                            {activeEvent.description}
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className={css({
                        fontSize: "14px",
                        color: "gray.500",
                        fontStyle: "italic",
                        marginBottom: "8px",
                    })}
                >
                    No active event
                </div>
            )}

            {events.length > 1 && (
                <select
                    value={activeEvent?.id || ""}
                    onChange={(e) => setActiveEvent(e.target.value)}
                    disabled={isLoading}
                    className={css({
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: "12px",
                        border: "1px solid",
                        borderColor: "gray.300",
                        borderRadius: "4px",
                        backgroundColor: "white",
                        cursor: "pointer",
                        "&:disabled": {
                            opacity: 0.6,
                            cursor: "not-allowed",
                        },
                    })}
                >
                    <option value="">No Active Event</option>
                    {events.map((event) => (
                        <option key={event.id} value={event.id}>
                            {event.name}
                        </option>
                    ))}
                </select>
            )}

            {events.length <= 1 && events.length > 0 && !activeEvent && (
                <button
                    onClick={() => setActiveEvent(events[0].id)}
                    disabled={isLoading}
                    className={css({
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: "12px",
                        backgroundColor: "blue.600",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "500",
                        "&:hover": {
                            backgroundColor: "blue.700",
                        },
                        "&:disabled": {
                            opacity: 0.6,
                            cursor: "not-allowed",
                        },
                    })}
                >
                    Activate {events[0].name}
                </button>
            )}

            {activeEvent && (
                <div
                    className={css({
                        marginTop: "8px",
                        display: "flex",
                        gap: "4px",
                    })}
                >
                    <button
                        onClick={() => setActiveEvent("")}
                        disabled={isLoading}
                        className={css({
                            flex: 1,
                            padding: "4px 6px",
                            fontSize: "11px",
                            backgroundColor: "gray.200",
                            color: "gray.700",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            "&:hover": {
                                backgroundColor: "gray.300",
                            },
                            "&:disabled": {
                                opacity: 0.6,
                                cursor: "not-allowed",
                            },
                        })}
                    >
                        Deactivate
                    </button>
                </div>
            )}
        </div>
    );
}
