'use client'

import Panel from "./ui/Panel"
import H2 from "./ui/H2"
import Button from "./ui/Button"
import { useContext, useState } from "react"
import { AuthContext } from "./global/Auth"
import { Activity } from "@/app/api/activities/route"

const ActivityDisplay = ({
    activity,
    onDelete
}: {
    activity: Activity,
    onDelete: (id: string) => Promise<void>
}) => {
    const { isEditor } = useContext(AuthContext);

    const [pending, setPending] = useState(false);

    async function deleteActivity() {
        const confirmed = confirm(`Are you sure you want to delete "${activity.title}"?`);
        if (!confirmed) {
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
            {isEditor() && <Button onClick={deleteActivity} disabled={pending} className="danger">Delete</Button>}
        </Panel>
    )
}

export default ActivityDisplay