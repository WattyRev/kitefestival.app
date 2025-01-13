'use client'

import { useState } from "react";
import { useAuth } from "./global/Auth";
import Panel from "./ui/Panel";
import TextInput from "./ui/TextInput";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";
import H1 from "./ui/H1";
import { css } from "../../styled-system/css";

const CreateActivityForm = ({ onSubmit }) => {
    const { isEditor } = useAuth();
    const [ pending, setPending ] = useState(false);
    const [ title, setTitle ] = useState('');
    const [ description, setDescription ] = useState('');

    if (!isEditor()) {
        return null;
    }

    async function submit() {
        setPending(true);
        await onSubmit({ title, description });
        setTitle('');
        setDescription('');
        setPending(false);
    }
    return (
        <form data-testid="create-activity-form" onSubmit={e => {e.preventDefault(); submit()}}>
            <H1 className={css({ paddingLeft: '16px', paddingTop: '32px'})}>Create Activity</H1>
            <Panel>
                <label>Title</label>
                <TextInput data-testid="title" required value={title} onChange={e => setTitle(e.target.value)} />
                <label>Description</label>
                <Textarea data-testid="description" required value={description} onChange={e => setDescription(e.target.value)} />
                <Button data-testid="save-activity" type="submit" disabled={pending}>Save</Button>
            </Panel>
        </form>
    )
}

export default CreateActivityForm;