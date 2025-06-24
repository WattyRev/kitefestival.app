'use client'

import { useState } from "react";
import { useAuth } from "./global/Auth";
import Panel from "./ui/Panel";
import TextInput from "./ui/TextInput";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";
import H1 from "./ui/H1";
import { css } from "../../styled-system/css";

const ActivityForm = ({ onSubmit, title: defaultTitle = '', description: defaultDescription = '', onCancel, autoFocus = false }) => {
    const { isEditor } = useAuth();
    const [ pending, setPending ] = useState(false);
    const [ title, setTitle ] = useState(defaultTitle);
    const [ description, setDescription ] = useState(defaultDescription);

    if (!isEditor()) {
        return null;
    }

    async function submit() {
        setPending(true);
        await onSubmit({ title, description });
        setTitle(defaultTitle);
        setDescription(defaultDescription);
        setPending(false);
    }
    return (
        <form data-testid="create-activity-form" onSubmit={e => {e.preventDefault(); submit()}}>
            <H1 className={css({ 
                paddingLeft: { base: '12px', sm: '16px' }, 
                paddingTop: { base: '16px', sm: '32px' },
                fontSize: { base: '20px', sm: '24px' }
            })}>Create Activity</H1>
            <Panel>
                <label>Title</label>
                <TextInput autoFocus={autoFocus} data-testid="title" required value={title} onChange={e => setTitle(e.target.value)} />
                <label>Description</label>
                <Textarea data-testid="description" value={description} onChange={e => setDescription(e.target.value)} />
                <Button data-testid="save-activity" type="submit" disabled={pending}>Save</Button>
                {onCancel && <Button data-testid="cancel-activity" className="secondary" onClick={onCancel}>Cancel</Button>}
            </Panel>
        </form>
    )
}

export default ActivityForm;