'use client'

import { useContext, useState } from "react";
import { AuthContext } from "@/components/global/Auth";
import Panel from "./ui/Panel";
import TextInput from "./ui/TextInput";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";

const CreateActivityForm = () => {
    const { isEditor, auth } = useContext(AuthContext);
    const [ pending, setPending ] = useState(false);
    const [ title, setTitle ] = useState('');
    const [ description, setDescription ] = useState('');

    if (!isEditor()) {
        return (<p>Only an editor can create activities.</p>)
    }

    async function submit() {
        setPending(true);
        const response = await fetch('/api/activities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, passcode: auth?.passcode })
        })
        if (!response.ok) {
            alert('Failed to create activity');
            setPending(false);
            return;
        }
        setTitle('');
        setDescription('');
        setPending(false);
    }
    return (
        <form onSubmit={e => {e.preventDefault(); submit()}}>
            <Panel>
                <label>Title</label>
                <TextInput required value={title} onChange={e => setTitle(e.target.value)} />
                <label>Description</label>
                <Textarea required value={description} onChange={e => setDescription(e.target.value)} />
            </Panel>
            <Button type="submit" disabled={pending}>Submit</Button>
        </form>
    )
}

export default CreateActivityForm;