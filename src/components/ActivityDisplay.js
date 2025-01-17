'use client'

import Panel from "./ui/Panel"
import H2 from "./ui/H2"
import { useState } from "react"
import { useAuth } from "./global/Auth"
import { usePrompt } from "./ui/Prompt"
import { css } from "../../styled-system/css"
import Dropdown, { DropdownItem } from "./ui/Dropdown"
import PlainButton from "./ui/PlainButton"
import Modal from "./ui/Modal"
import ActivityForm from "./ActivityForm"
import LinkButton from "./ui/LinkButton"
import { useDraggable } from "@dnd-kit/core"



const ActivityDisplay = ({
    activity,
    onDelete,
    onSchedule,
    onUnschedule,
    onMoveUp,
    onMoveDown,
    onEdit,
    children,
    allowHideDescription = true
}) => {
    const { isEditor } = useAuth();
    const { openPrompt } = usePrompt();
    const [ isDescriptionVisible, setIsDescriptionVisible ] = useState(false);

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

    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: activity.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      } : undefined;

    return (
        <div ref={setNodeRef} style={style}{...attributes}>
            <Panel >
                <div className={css({
                    display: 'flex',
                })}>
                    {isEditor() && (
                        <div
                            {...listeners} 
                            className={css({
                                padding: '0 8px 0 0',
                                display: 'flex',
                                alignItems: 'center',
                                borderRight: '1px solid var(--colors-secondary)',
                                marginRight: '8px',
                                cursor: 'grab',
                            })}
                        >
                            <i className="fa-solid fa-grip-lines"></i>
                        </div>
                    )}
                    <div className={css({ flexGrow: 1 })}>
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
                                            {onMoveUp && <DropdownItem data-testid="move-up" onClick={moveUp} disabled={pending} title="Move Up"><i className="fa-solid fa-arrow-up"/> Move Up</DropdownItem>}
                                            {onMoveDown && <DropdownItem data-testid="move-down" onClick={moveDown} disabled={pending} title="Move Down"><i className="fa-solid fa-arrow-down"/> Move Down</DropdownItem>}
                                            {onSchedule && <DropdownItem data-testid="add-schedule" onClick={addToSchedule} disabled={pending} title="Add to Schedule"><i className="fa-regular fa-calendar-plus" /> Add to Schedule</DropdownItem>}
                                            {onUnschedule && <DropdownItem data-testid="remove-schedule" onClick={removeFromSchedule} disabled={pending} title="Remove from Schedule"><i className="fa-regular fa-calendar-minus" /> Remove from Schedule</DropdownItem>}
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
                        
                        {(isDescriptionVisible || !allowHideDescription) && activity.description.split('\n').map((line, index) => <p key={`${line}${index}`}>{line}&nbsp;</p>)}
                        <div 
                            className={css({ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start', 
                                marginTop: '8px'
                            })}
                        >
                            <div>
                                {(isDescriptionVisible && allowHideDescription) && <LinkButton data-testid="show-less" onClick={() => setIsDescriptionVisible(false)}>Show less</LinkButton>}
                                {(!isDescriptionVisible && allowHideDescription) && <LinkButton data-testid="show-more" onClick={() => setIsDescriptionVisible(true)}>Show more</LinkButton>}
                            </div>
                            <div>{children}</div>
                        </div>
                    </div>
                </div>
                <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                    <ActivityForm
                        title={activity.title}
                        description={activity.description}
                        onCancel={() => setIsEditing(false)}
                        onSubmit={editActivity}
                        autoFocus
                    />
                </Modal>
            </Panel>
        </div>
    )
}

export default ActivityDisplay