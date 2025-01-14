'use client'

import Panel from "./ui/Panel"
import H2 from "./ui/H2"
import Button from "./ui/Button"
import { useState } from "react"
import { useAuth } from "./global/Auth"
import { usePrompt } from "./ui/Prompt"
import { css } from "../../styled-system/css"
import Dropdown, { DropdownItem } from "./ui/Dropdown"
import PlainButton from "./ui/PlainButton"
import Modal from "./ui/Modal"
import CreateActivityForm from "./CreateActivityForm"

const ActivityDisplay = ({
    activity,
    onDelete,
    onSchedule,
    onUnschedule,
    onMoveUp,
    onMoveDown,
    onEdit,
    children,
}) => {
    const { isEditor } = useAuth();
    const { openPrompt } = usePrompt();

    const [pending, setPending] = useState(false);
    const [ isEditing, setIsEditing ] = useState(false);

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

    async function moveUp() {
        setPending(true);
        await onMoveUp(activity.id);
        setPending(false);
    }

    async function moveDown() {
        setPending(true);
        await onMoveDown(activity.id);
        setPending(false);
    }

    async function editActivity(updatedActivity) {
        setPending(true);
        await onEdit({ id: activity.id, ...updatedActivity});
        setPending(false);
        setIsEditing(false);
    }


    return (
        <Panel>
            <div className={css({
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            })}>
                <H2>{activity.title}</H2>
                {isEditor() && (
                    <Dropdown
                        dropdownContent={(() => (
                            <>
                                <DropdownItem data-testid="edit-activity" onClick={() => setIsEditing(true)} disabled={pending}><i className="fa-solid fa-pen"/> Edit Activity</DropdownItem>
                                <DropdownItem data-testid="delete-activity" onClick={deleteActivity} disabled={pending}><i className="fa-solid fa-trash"/> Delete Activity</DropdownItem>
                            </>
                        ))}
                    >
                        {({ open, close, isOpen }) => (
                            <PlainButton data-testid="activity-dropdown" className={css({ cursor: 'pointer' })} onClick={isOpen ? close : open}><i className="fa-solid fa-ellipsis"></i></PlainButton>
                        )}
                    </Dropdown>
                )}
            </div>
            <p>{activity.description}</p>
            <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' })}>
                {isEditor() && (
                    <div>
                        {onMoveUp && <Button data-testid="move-up" onClick={moveUp} disabled={pending} title="Move Up" className="secondary"><i className="fa-solid fa-arrow-up"/></Button>}
                        {onMoveDown && <Button data-testid="move-down" onClick={moveDown} disabled={pending} title="Move Down" className="secondary"><i className="fa-solid fa-arrow-down"/></Button>}
                        {onSchedule && <Button data-testid="add-schedule" onClick={addToSchedule} disabled={pending} title="Add to Schedule" className="secondary"><i className="fa-regular fa-calendar-plus" /></Button>}
                        {onUnschedule && <Button data-testid="remove-schedule" onClick={removeFromSchedule} disabled={pending} className="secondary" title="Remove from Schedule"><i className="fa-regular fa-calendar-minus" /></Button>}
                    </div>
                )}
                <div>{children}</div>
            </div>
            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                <CreateActivityForm
                    title={activity.title}
                    description={activity.description}
                    onCancel={() => setIsEditing(false)}
                    onSubmit={editActivity}
                    autoFocus
                />
            </Modal>
        </Panel>
    )
}

export default ActivityDisplay