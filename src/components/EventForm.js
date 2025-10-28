"use client";

import { useState } from "react";
import { useAuth } from "./global/Auth";
import H1 from "./ui/H1";
import TextInput from "./ui/TextInput";
import Button from "./ui/Button";
import { useAlert } from "./ui/Alert";
import Textarea from "./ui/Textarea";
import { css } from "../../styled-system/css";
import Panel from "./ui/Panel";
import { createEvent, editEvent } from "../app/api/events";

const makeSlugFromName = (name) => {
    return encodeURIComponent(
        name
            .toLowerCase()
            .replace(/ /g, "_")
            .replace(/[^\w-]+/g, ""),
    );
};

const EventForm = ({
    initialEvent = {},
    isEdit = false,
    onSubmit = () => {},
    onCancel,
}) => {
    const { isEditor } = useAuth();
    const [pending, setPending] = useState(false);
    const [name, setName] = useState(initialEvent.name || "");
    const [description, setDescription] = useState(
        initialEvent.description || "",
    );

    const { openAlert } = useAlert();

    if (!isEditor()) {
        return null;
    }

    async function createNewEvent() {
        let response;
        try {
            const payload = {
                name,
                slug: makeSlugFromName(name),
                description: description,
            };
            response = await createEvent(payload);
        } catch (error) {
            errorMessage = error.message;
            throw new Error(response.statusText);
        }
        return response.event;
    }

    async function updateEvent() {
        let response;
        try {
            response = await editEvent(initialEvent.id, {
                name,
                description,
            });
        } catch (error) {
            errorMessage = error.message;
            throw new Error(response.statusText);
        }

        return response.event;
    }

    async function submit() {
        setPending(true);
        let savedEvent;
        let errorMessage;
        try {
            if (isEdit) {
                savedEvent = await updateEvent();
            } else {
                savedEvent = await createNewEvent();
            }
        } catch (error) {
            openAlert("Failed to save event. Reason: " + errorMessage, "error");
            setPending(false);
            return;
        }
        onSubmit(savedEvent);
        setName("");
        setDescription("");
        setPending(false);
    }

    return (
        <form
            data-testid="create-event-form"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <H1>{isEdit ? "Edit Event" : "Create Event"}</H1>
            <Panel>
                <label>Event Name (required)</label>
                <TextInput
                    data-testid="event-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <p
                    className={css({
                        marginBottom: "16px",
                        fontStyle: "italic",
                        fontSize: "14px",
                    })}
                >
                    <em>
                        URL Slug: {initialEvent.slug || makeSlugFromName(name)}
                    </em>
                </p>
                <label>Description</label>
                <Textarea
                    data-testid="event-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Button
                    data-testid="save-event"
                    type="submit"
                    disabled={pending}
                >
                    Save
                </Button>
                {onCancel && (
                    <Button
                        onClick={onCancel}
                        className="secondary"
                        disabled={pending}
                    >
                        Cancel
                    </Button>
                )}
            </Panel>
        </form>
    );
};

export default EventForm;
