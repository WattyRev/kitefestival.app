'use client'

import Panel from "./ui/Panel"
import H2 from "./ui/H2"
import Button from "./ui/Button"
import { useState } from "react"
import { useAuth } from "./global/Auth"
import { usePrompt } from "./ui/Prompt"

const ActivityDisplay = ({
    activity,
    onDelete,
    onSchedule,
    onUnschedule,
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

    async function addToSchedule() {
        setPending(true);
        await onSchedule(activity.id);
        setPending(false);
    }

    async function removeFromSchedule() {
        setPending(true);
        await onUnschedule(activity.id);
        setPending(false);
    }

    return (
        <Panel>
            <H2>{activity.title}</H2>
            <p>{activity.description}</p>
            {isEditor() && (
                <>
                    {onSchedule && <Button data-testid="add-schedule" onClick={addToSchedule} disabled={pending}>Add to Schedule</Button>}
                    {onUnschedule && <Button data-testid="remove-schedule" onClick={removeFromSchedule} disabled={pending}>Remove from Schedule</Button>}
                    <Button data-testid="delete-activity" onClick={deleteActivity} disabled={pending} className="danger">Delete</Button>
                </>
            )}
        </Panel>
    )
}

export default ActivityDisplay