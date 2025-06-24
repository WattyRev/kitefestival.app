'use client'

import { useState } from "react";
import { useAuth } from "./global/Auth";
import Panel from "./ui/Panel";
import TextInput from "./ui/TextInput";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";
import H1 from "./ui/H1";
import { css } from "../../styled-system/css";

const EventForm = ({ 
    onSubmit, 
    title: defaultTitle = '', 
    description: defaultDescription = '', 
    startDate: defaultStartDate = '',
    endDate: defaultEndDate = '',
    onCancel, 
    autoFocus = false 
}) => {
    const { isEditor } = useAuth();
    const [pending, setPending] = useState(false);
    const [title, setTitle] = useState(defaultTitle);
    const [description, setDescription] = useState(defaultDescription);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);

    if (!isEditor()) {
        return null;
    }

    async function submit() {
        setPending(true);
        await onSubmit({ title, description, startDate, endDate });
        setTitle(defaultTitle);
        setDescription(defaultDescription);
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setPending(false);
    }

    return (
        <form data-testid="create-event-form" onSubmit={e => {e.preventDefault(); submit()}}>
            <H1 className={css({ paddingLeft: '16px', paddingTop: '32px'})}>Create Event</H1>
            <Panel>
                <label>Title</label>
                <TextInput 
                    autoFocus={autoFocus} 
                    data-testid="event-title" 
                    required 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                />
                <label>Description</label>
                <Textarea 
                    data-testid="event-description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                />
                <label>Start Date</label>
                <TextInput 
                    data-testid="event-start-date" 
                    type="datetime-local"
                    required 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                />
                <label>End Date</label>
                <TextInput 
                    data-testid="event-end-date" 
                    type="datetime-local"
                    required 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                />
                <Button data-testid="save-event" type="submit" disabled={pending}>Save</Button>
                {onCancel && <Button data-testid="cancel-event" className="secondary" onClick={onCancel}>Cancel</Button>}
            </Panel>
        </form>
    );
};

export default EventForm;
