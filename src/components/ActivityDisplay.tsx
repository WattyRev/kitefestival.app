'use client'

import Panel from "./ui/Panel"
import H2 from "./ui/H2"
import Button from "./ui/Button"
import { Activity } from "./HomePageContainer"
import { useContext, useState } from "react"
import { AuthContext } from "./global/Auth"

const ActivityDisplay = ({
    activity
}: {
    activity: Activity
}) => {
    const { isEditor, auth } = useContext(AuthContext);

    const [pending, setPending] = useState(false);

    async function deleteActivity() {
        const confirmed = confirm(`Are you sure you want to delete "${activity.title}"?`);
        if (!confirmed) {
            return;
        }

        setPending(true);

        const response = await fetch(`/api/activities/${activity.id}`, {
            method: 'DELETE',
            body: JSON.stringify({
                passcode: auth?.passcode
            })
        });
        if (!response.ok) {
            alert('Failed to delete activity');
            setPending(false);
            return;
        }
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