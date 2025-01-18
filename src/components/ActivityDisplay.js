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
    onMoveTop,
    onMoveBottom,
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

    async function dispatch(callbackfn, args) {
        setPending(true);
        await callbackfn(...args);
        setPending(false);
    }

    async function editActivity(updatedActivity) {
        setPending(true);
        await onEdit({ id: activity.id, ...updatedActivity});
        setPending(false);
        setIsEditing(false);
    }

    const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
        id: activity.id,
    });

    const style = transform && isEditor() ? {
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '2px 2px 2px 2px rgba(0, 0, 0, 0.5)' : undefined,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      } : undefined;



    const truncatedDescriptionLength = 100;

    function isDescriptionTruncatable() {
        const minimumCharacterCutoff = 3;
        const lines = activity.description.split('\n');
        if (lines.length > 2) {
            return true;
        }
        return allowHideDescription && activity.description.length > truncatedDescriptionLength - minimumCharacterCutoff;
    }

    function getDescription() {
        if (isDescriptionVisible || !allowHideDescription) {
            return activity.description;
        }
        let description = activity.description.trim().split('\n').slice(0, 2).join('\n');
        if (isDescriptionTruncatable()) {
            description = description.substring(0, truncatedDescriptionLength) + '...';
        }

        return description;
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} >
            <Panel >
                <div className={css({
                    display: 'flex',
                })}>
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
                                            <DropdownItem 
                                                data-testid="edit-activity"
                                                onClick={() => setIsEditing(true)}
                                                disabled={pending}
                                            >
                                                <i className="fa-solid fa-pen"/> Edit Activity
                                            </DropdownItem>
                                            {onMoveTop && <DropdownItem 
                                                data-testid="move-top" 
                                                onClick={() => dispatch(onMoveTop, [activity.id])} 
                                                disabled={pending} 
                                                title="Move to Top"
                                            >
                                                <i className="fa-solid fa-arrows-up-to-line"/> Move to Top
                                            </DropdownItem>}
                                            {onMoveUp && <DropdownItem 
                                                data-testid="move-up" 
                                                onClick={() => dispatch(onMoveUp, [activity.id])} 
                                                disabled={pending} 
                                                title="Move Up"
                                            >
                                                <i className="fa-solid fa-arrow-up"/> Move Up
                                            </DropdownItem>}
                                            {onMoveDown && <DropdownItem 
                                                data-testid="move-down" 
                                                onClick={() => dispatch(onMoveDown, [activity.id])}  
                                                disabled={pending} 
                                                title="Move Down"
                                            >
                                                <i className="fa-solid fa-arrow-down"/> Move Down
                                            </DropdownItem>}
                                            {onMoveBottom && <DropdownItem 
                                                data-testid="move-bottom" 
                                                onClick={() => dispatch(onMoveBottom, [activity.id])}  
                                                disabled={pending} 
                                                title="Move to Bottom"
                                            >
                                                <i className="fa-solid fa-arrows-down-to-line"/> Move to Bottom
                                            </DropdownItem>}
                                            {onSchedule && <DropdownItem 
                                                data-testid="add-schedule"
                                                onClick={() => dispatch(onSchedule, [activity.id])}
                                                disabled={pending} 
                                                title="Add to Schedule"
                                            >
                                                <i className="fa-regular fa-calendar-plus" /> Add to Schedule
                                            </DropdownItem>}
                                            {onUnschedule && <DropdownItem 
                                                data-testid="remove-schedule"
                                                onClick={() => dispatch(onUnschedule, [activity.id])}
                                                disabled={pending} 
                                                title="Remove from Schedule"
                                            >
                                                <i className="fa-regular fa-calendar-minus" /> Remove from Schedule
                                            </DropdownItem>}
                                            <DropdownItem 
                                                data-testid="delete-activity" 
                                                onClick={deleteActivity} 
                                                disabled={pending}
                                            >
                                                <i className="fa-solid fa-trash"/> Delete Activity
                                            </DropdownItem>
                                        </>
                                    ))}
                                >
                                    {({ open, close, isOpen }) => (
                                        <PlainButton data-testid="activity-dropdown" className={css({ cursor: 'pointer' })} onClick={isOpen ? close : open}><i className="fa-solid fa-ellipsis"></i></PlainButton>
                                    )}
                                </Dropdown>
                            )}
                        </div>

                        {getDescription().split('\n').map((line, index) => <p key={`${line}${index}`}>{line}&nbsp;</p>)}
                        
                        
                        <div 
                            className={css({ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start', 
                                marginTop: '8px'
                            })}
                        >
                            <div>
                                {(isDescriptionTruncatable() && isDescriptionVisible && allowHideDescription) && <LinkButton data-testid="show-less" onClick={() => setIsDescriptionVisible(false)}>Show less</LinkButton>}
                                {(isDescriptionTruncatable() && !isDescriptionVisible && allowHideDescription) && <LinkButton data-testid="show-more" onClick={() => setIsDescriptionVisible(true)}>Show more</LinkButton>}
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