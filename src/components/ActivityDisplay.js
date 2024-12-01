'use client'

import Panel from "./ui/Panel"
import H2 from "./ui/H2"
import Button from "./ui/Button"
import { useState } from "react"
import { useAuth } from "./global/Auth"
import { usePrompt } from "./ui/Prompt"

const ActivityDisplay = ({
    activity,
    onDelete
}) => {
    const { isEditor } = useAuth();
    const { openPrompt } = usePrompt();

    const [pending, setPending] = useState(false);

    async function deleteActivity() {
        try {
            await openPrompt(`Are you sure you want to delete "${activity.title}"?`, 'confirm');
        } catch {
            return;
        }

        setPending(true);
        await onDelete(activity.id);
        setPending(false);
    }

    return (
        <Panel>
            <H2>{activity.title}</H2>
            <p>{activity.description}</p>
            {isEditor() && <Button data-testid="delete-activity" onClick={deleteActivity} disabled={pending} className="danger">Delete</Button>}
        </Panel>
    )
}

export default ActivityDisplay