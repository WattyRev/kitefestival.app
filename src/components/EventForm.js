"use client"

import { useState } from "react";
import { useAuth } from "./global/Auth";
import H1 from "./ui/H1";
import TextInput from "./ui/TextInput";
import Button from "./ui/Button";
import { useAlert } from "./ui/Alert";

const makeSlugFromName = name => {
    return encodeURIComponent(name
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/[^\w-]+/g, "")
    )
}

const EventForm = ({ isEdit = false, onSubmit = () => {}, onCancel }) => {
    const { isEditor } = useAuth();
    const [pending, setPending] = useState(false);
    const [name, setName] = useState("");

    const { openAlert } = useAlert();
    
    
    if (!isEditor()) {
        return null;
    }

    async function submit() {
        setPending(true);
        let savedEvent;
        let errorMessage;
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                body: JSON.stringify({
                    event: {
                        name,
                        slug: makeSlugFromName(name)
                    }
                })
            });
            const json = await response.json();
            if (!response.ok) {
                errorMessage = json.message;
                throw new Error(response.statusText);
            }
            savedEvent = json.event;
        } catch (error) {
            openAlert('Failed to save event. Reason: ' + errorMessage, 'error');
            setPending(false);
            return;
        }
        onSubmit(savedEvent);
        setName("");
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
            <TextInput
                data-testid="name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Event Name"
            />
            <p><em>Slug: {makeSlugFromName(name)}</em></p>
            <Button
                data-testid="submit-event"
                type="submit"
                disabled={pending}
            >Save</Button>
            {onCancel && <Button onClick={onCancel} className="secondary">Cancel</Button>}
        </form>
    )
}

export default EventForm;