'use client'

import { useContext, useState } from "react";
import { AuthContext } from "@/components/global/Auth";
import Panel from "./ui/Panel";
import TextInput from "./ui/TextInput";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";
import H1 from "./ui/H1";

const CreateActivityForm = ({ onSubmit }: { onSubmit: (activity: { title: string, description: string }) => Promise<void> }) => {
    const { isEditor } = useContext(AuthContext);
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
        <form onSubmit={e => {e.preventDefault(); submit()}}>
            <H1>Create Activity</H1>
            <Panel>
                <label>Title</label>
                <TextInput required value={title} onChange={e => setTitle(e.target.value)} />
                <label>Description</label>
                <Textarea required value={description} onChange={e => setDescription(e.target.value)} />
            </Panel>
            <Button type="submit" disabled={pending}>Save</Button>
        </form>
    )
}

export default CreateActivityForm;