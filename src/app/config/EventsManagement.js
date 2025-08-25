"use client";

import { useState, useEffect, useCallback } from "react";
import { css } from "../../../styled-system/css";

export default function EventsManagement() {
    const [events, setEvents] = useState([]);
    const [activeEvent, setActiveEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    // Form state for create/edit
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
    });

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch("/api/events");
            if (!res.ok) throw new Error("Failed to fetch events");
            const data = await res.json();
            setEvents(data.events);

            // Find and set active event
            const active = data.events.find((event) => event.isActive);
            setActiveEvent(active || null);
        } catch (e) {
            setError(e.message || "Failed to fetch events");
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            location: "",
        });
        setEditingEvent(null);
        setShowCreateForm(false);
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();

        try {
            // Prompt for admin passcode (required by API)
            const passcode = window.prompt(
                "Enter the ADMIN passcode to create the event:",
            );
            if (!passcode) {
                setError("Creation cancelled: No passcode provided.");
                setLoading(false);
                return;
            }
            // Set short-lived passcode cookie (5 minutes)
            document.cookie = `passcode=${encodeURIComponent(passcode)}; path=/; max-age=300`;

            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to create event");
            }

            const data = await res.json();
            setEvents((prev) => [data.event, ...prev]);
            setSuccess(`Event "${data.event.name}" created successfully!`);
            resetForm();
        } catch (e) {
            setError(e.message || "Failed to create event");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        if (!editingEvent) return;

        setLoading(true);
        clearMessages();

        try {
            const res = await fetch(`/api/events/${editingEvent.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to update event");
            }

            const data = await res.json();
            setEvents((prev) =>
                prev.map((event) =>
                    event.id === editingEvent.id ? data.event : event,
                ),
            );

            if (data.event.isActive) {
                setActiveEvent(data.event);
            }

            setSuccess(`Event "${data.event.name}" updated successfully!`);
            resetForm();
        } catch (e) {
            setError(e.message || "Failed to update event");
        } finally {
            setLoading(false);
        }
    };

    const handleActivateEvent = async (eventId) => {
        setLoading(true);
        clearMessages();

        try {
            const res = await fetch(`/api/events/${eventId}/activate`, {
                method: "POST",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to activate event");
            }

            const data = await res.json();

            // Update events list - deactivate all others, activate this one
            setEvents((prev) =>
                prev.map((event) => ({
                    ...event,
                    isActive: event.id === eventId,
                })),
            );

            setActiveEvent(data.activeEvent);
            setSuccess(data.message);
        } catch (e) {
            setError(e.message || "Failed to activate event");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (event) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${event.name}"? This will also delete all associated activities and comments. This cannot be undone.`,
            )
        ) {
            return;
        }

        const passcode = window.prompt(
            "Enter the ADMIN passcode to confirm deletion:",
        );
        if (!passcode) {
            setError("Deletion cancelled: No passcode provided.");
            return;
        }

        setLoading(true);
        clearMessages();

        try {
            // Set passcode cookie
            document.cookie = `passcode=${encodeURIComponent(passcode)}; path=/; max-age=300`;

            const res = await fetch(`/api/events/${event.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete event");
            }

            const data = await res.json();

            // Download backup of deleted data
            const blob = new Blob([JSON.stringify(data.deletedData, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `deleted-event-${event.name}-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            // Update state
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
            if (activeEvent && activeEvent.id === event.id) {
                setActiveEvent(null);
            }

            setSuccess(
                `Event "${event.name}" deleted successfully. Backup downloaded.`,
            );
        } catch (e) {
            setError(e.message || "Failed to delete event");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (event) => {
        const toDateInput = (value) => {
            if (!value) return "";
            const d = new Date(value);
            if (isNaN(d.getTime())) return "";
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };
        setFormData({
            name: event.name,
            description: event.description || "",
            startDate: toDateInput(event.startDate),
            endDate: toDateInput(event.endDate),
            location: event.location || "",
        });
        setEditingEvent(event);
        setShowCreateForm(true);
    };

    return (
        <div
            className={css({
                padding: "20px",
                maxWidth: "800px",
                margin: "0 auto",
            })}
        >
            <div
                className={css({
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                })}
            >
                <h2
                    className={css({
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "black",
                    })}
                >
                    Events Management
                </h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    disabled={loading}
                    className={css({
                        padding: "10px 16px",
                        backgroundColor: "blue.600",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "500",
                        "&:hover": { backgroundColor: "blue.700" },
                        "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
                    })}
                >
                    {showCreateForm ? "Cancel" : "Create New Event"}
                </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div
                    className={css({
                        padding: "12px",
                        backgroundColor: "red.50",
                        border: "1px solid red.200",
                        borderRadius: "6px",
                        color: "red.800",
                        marginBottom: "16px",
                    })}
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className={css({
                        padding: "12px",
                        backgroundColor: "green.50",
                        border: "1px solid green.200",
                        borderRadius: "6px",
                        color: "green.800",
                        marginBottom: "16px",
                    })}
                >
                    {success}
                </div>
            )}

            {/* Active Event Display */}
            {activeEvent && (
                <div
                    className={css({
                        padding: "16px",
                        backgroundColor: "blue.50",
                        border: "2px solid blue.200",
                        borderRadius: "8px",
                        marginBottom: "20px",
                    })}
                >
                    <h3
                        className={css({
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "black",
                            marginBottom: "8px",
                        })}
                    >
                        🎪 Active Event: {activeEvent.name}
                    </h3>
                    <p className={css({ color: "blue.700" })}>
                        <span style={{ color: 'black' }}>{activeEvent.description || "No description"}</span>
                    </p>
                    {activeEvent.location && (
                        <p
                            className={css({
                                color: "blue.600",
                                fontSize: "14px",
                            })}
                        >
                            📍 {activeEvent.location}
                        </p>
                    )}
                </div>
            )}

            {/* Create/Edit Form */}
            {showCreateForm && (
                <form
                    onSubmit={
                        editingEvent ? handleUpdateEvent : handleCreateEvent
                    }
                    className={css({
                        padding: "20px",
                        border: "1px solid gray.200",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        backgroundColor: "white",
                    })}
                >
                    <h3
                        className={css({
                            fontSize: "18px",
                            fontWeight: "600",
                            marginBottom: "16px",
                        })}
                    >
                        {editingEvent
                            ? `Edit Event: ${editingEvent.name}`
                            : "Create New Event"}
                    </h3>

                    <div className={css({ marginBottom: "16px" })}>
                        <label
                            className={css({
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                                color: "black",
                            })}
                        >
                            Event Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            required
                            className={css({
                                width: "100%",
                                padding: "8px 12px",
                                border: "2px solid #e2e8f0",
                                borderRadius: "4px",
                                fontSize: "14px",
                                backgroundColor: "white",
                                color: "black",
                                "&:focus": {
                                    borderColor: "#3182ce",
                                    outline: "none",
                                    boxShadow: "0 0 0 3px rgba(49, 130, 206, 0.1)"
                                }
                            })}
                        />
                    </div>

                    <div className={css({ marginBottom: "16px" })}>
                        <label
                            className={css({
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                                color: "black",
                            })}
                        >
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            rows={3}
                            className={css({
                                width: "100%",
                                padding: "8px 12px",
                                border: "2px solid #e2e8f0",
                                borderRadius: "4px",
                                fontSize: "14px",
                                resize: "vertical",
                                backgroundColor: "white",
                                color: "black",
                                "&:focus": {
                                    borderColor: "#3182ce",
                                    outline: "none",
                                    boxShadow: "0 0 0 3px rgba(49, 130, 206, 0.1)"
                                }
                            })}
                        />
                    </div>

                    <div
                        className={css({
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px",
                            marginBottom: "16px",
                        })}
                    >
                        <div>
                            <label
                                className={css({
                                    display: "block",
                                    marginBottom: "4px",
                                    fontWeight: "500",
                                    color: "black",
                                })}
                            >
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        startDate: e.target.value,
                                    }))
                                }
                                className={css({
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: "2px solid #e2e8f0",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                    color: "black",
                                    "&:focus": {
                                        borderColor: "#3182ce",
                                        outline: "none",
                                        boxShadow: "0 0 0 3px rgba(49, 130, 206, 0.1)"
                                    }
                                })}
                            />
                        </div>

                        <div>
                            <label
                                className={css({
                                    display: "block",
                                    marginBottom: "4px",
                                    fontWeight: "500",
                                    color: "black",
                                })}
                            >
                                End Date
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        endDate: e.target.value,
                                    }))
                                }
                                className={css({
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: "2px solid #e2e8f0",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                    color: "black",
                                    "&:focus": {
                                        borderColor: "#3182ce",
                                        outline: "none",
                                        boxShadow: "0 0 0 3px rgba(49, 130, 206, 0.1)"
                                    }
                                })}
                            />
                        </div>
                    </div>

                    <div className={css({ marginBottom: "16px" })}>
                        <label
                            className={css({
                                display: "block",
                                marginBottom: "4px",
                                fontWeight: "500",
                                color: "black",
                            })}
                        >
                            Location
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    location: e.target.value,
                                }))
                            }
                            className={css({
                                width: "100%",
                                padding: "8px 12px",
                                border: "2px solid #e2e8f0",
                                borderRadius: "4px",
                                fontSize: "14px",
                                backgroundColor: "white",
                                color: "black",
                                "&:focus": {
                                    borderColor: "#3182ce",
                                    outline: "none",
                                    boxShadow: "0 0 0 3px rgba(49, 130, 206, 0.1)"
                                }
                            })}
                        />
                    </div>

                    <div className={css({ display: "flex", gap: "12px" })}>
                        <button
                            type="submit"
                            disabled={loading || !formData.name.trim()}
                            className={css({
                                padding: "10px 16px",
                                backgroundColor: "blue.600",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "500",
                                "&:hover": { backgroundColor: "blue.700" },
                                "&:disabled": {
                                    opacity: 0.6,
                                    cursor: "not-allowed",
                                },
                            })}
                        >
                            {loading
                                ? "Saving..."
                                : editingEvent
                                  ? "Update Event"
                                  : "Create Event"}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className={css({
                                padding: "10px 16px",
                                backgroundColor: "gray.200",
                                color: "gray.700",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "500",
                                "&:hover": { backgroundColor: "gray.300" },
                            })}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Events List */}
            <div className={css({ marginTop: "20px" })}>
                <h3
                    className={css({
                        fontSize: "18px",
                        fontWeight: "600",
                        marginBottom: "16px",
                    })}
                >
                    All Events ({events.length})
                </h3>

                {events.length === 0 ? (
                    <div
                        className={css({
                            padding: "40px",
                            textAlign: "center",
                            backgroundColor: "gray.50",
                            border: "1px solid gray.200",
                            borderRadius: "8px",
                            color: "gray.600",
                        })}
                    >
                        No events created yet. Create your first event to get
                        started!
                    </div>
                ) : (
                    <div
                        className={css({
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        })}
                    >
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className={css({
                                    padding: "16px",
                                    border: "1px solid gray.200",
                                    borderRadius: "8px",
                                    backgroundColor: event.isActive
                                        ? "blue.50"
                                        : "white",
                                    borderColor: event.isActive
                                        ? "blue.200"
                                        : "gray.200",
                                })}
                            >
                                <div
                                    className={css({
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "start",
                                    })}
                                >
                                    <div className={css({ flex: 1 })}>
                                        <h4
                                            className={css({
                                                fontSize: "16px",
                                                fontWeight: "600",
                                                color: event.isActive
                                                    ? "blue.800"
                                                    : "gray.800",
                                                marginBottom: "4px",
                                            })}
                                        >
                                            {event.isActive && "🎪 "}
                                            {event.name}
                                        </h4>
                                        {event.description && (
                                            <p
                                                className={css({
                                                    color: "gray.600",
                                                    marginBottom: "8px",
                                                    fontSize: "14px",
                                                })}
                                            >
                                                {event.description}
                                            </p>
                                        )}
                                        <div
                                            className={css({
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: "16px",
                                                fontSize: "12px",
                                                color: "gray.500",
                                            })}
                                        >
                                            {event.location && (
                                                <span>📍 {event.location}</span>
                                            )}
                                            {event.startDate && (
                                                <span>
                                                    🗓️ {new Date(event.startDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {event.endDate && (
                                                <span>
                                                    ⏰ Ends {new Date(event.endDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className={css({
                                            display: "flex",
                                            gap: "8px",
                                            marginLeft: "16px",
                                        })}
                                    >
                                        {!event.isActive && (
                                            <button
                                                onClick={() =>
                                                    handleActivateEvent(
                                                        event.id,
                                                    )
                                                }
                                                disabled={loading}
                                                className={css({
                                                    padding: "6px 12px",
                                                    backgroundColor:
                                                        "green.600",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: "500",
                                                    "&:hover": {
                                                        backgroundColor:
                                                            "green.700",
                                                    },
                                                    "&:disabled": {
                                                        opacity: 0.6,
                                                        cursor: "not-allowed",
                                                    },
                                                })}
                                            >
                                                Activate
                                            </button>
                                        )}
                                        <button
                                            onClick={() => startEdit(event)}
                                            disabled={loading}
                                            className={css({
                                                padding: "6px 12px",
                                                backgroundColor: "blue.600",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "12px",
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
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDeleteEvent(event)
                                            }
                                            disabled={loading}
                                            className={css({
                                                padding: "6px 12px",
                                                backgroundColor: "red.600",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                "&:hover": {
                                                    backgroundColor: "red.700",
                                                },
                                                "&:disabled": {
                                                    opacity: 0.6,
                                                    cursor: "not-allowed",
                                                },
                                            })}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
