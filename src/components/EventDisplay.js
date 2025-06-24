'use client'

import Panel from "./ui/Panel";
import H2 from "./ui/H2";
import { useState } from "react";
import { useAuth } from "./global/Auth";
import { usePrompt } from "./ui/Prompt";
import { css } from "../../styled-system/css";
import Dropdown, { DropdownItem } from "./ui/Dropdown";
import PlainButton from "./ui/PlainButton";
import Modal from "./ui/Modal";
import EventForm from "./EventForm";

const EventDisplay = ({
    event,
    onDelete,
    onEdit,
    onSetActive,
    isActive = false,
    children,
}) => {
    const { isEditor } = useAuth();
    const { openPrompt } = usePrompt();
    const [pending, setPending] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    async function deleteEvent() {
        try {
            await openPrompt(`Are you sure you want to delete "${event.title}"?`, 'confirm');
        } catch {
            return;
        }

        setPending(true);
        await onDelete(event.id);
        setPending(false);
    }

    async function editEvent(updatedEvent) {
        setPending(true);
        await onEdit({ id: event.id, ...updatedEvent });
        setPending(false);
        setIsEditing(false);
    }

    async function setActiveEvent() {
        setPending(true);
        await onSetActive(event.id);
        setPending(false);
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            <Panel className={css({
                border: isActive ? '2px solid #3a3ada' : 'none',
                position: 'relative'
            })}>
                <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' })}>
                    <div className={css({ flex: 1 })}>
                        <div className={css({ display: 'flex', alignItems: 'center', gap: '8px' })}>
                            <H2>{event.title}</H2>
                            {isActive && (
                                <span className={css({
                                    backgroundColor: '#3a3ada',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                })}>
                                    ACTIVE
                                </span>
                            )}
                        </div>
                        <p className={css({ margin: '8px 0' })}>{event.description}</p>
                        <div className={css({ fontSize: '14px', color: '#666' })}>
                            <p>Start: {formatDate(event.startDate)}</p>
                            <p>End: {formatDate(event.endDate)}</p>
                        </div>
                    </div>
                    {isEditor() && (
                        <Dropdown>
                            {({ open, close }) => (
                                <>
                                    <PlainButton 
                                        data-testid="event-dropdown" 
                                        className={css({ cursor: 'pointer' })} 
                                        onClick={open}
                                    >
                                        <i className="fa-solid fa-ellipsis"></i>
                                    </PlainButton>
                                    <div>
                                        {!isActive && (
                                            <DropdownItem 
                                                data-testid="set-active-event"
                                                onClick={setActiveEvent}
                                                disabled={pending}
                                            >
                                                <i className="fa-solid fa-star" /> Set as Active
                                            </DropdownItem>
                                        )}
                                        <DropdownItem 
                                            data-testid="edit-event"
                                            onClick={() => { setIsEditing(true); close(); }}
                                            disabled={pending}
                                        >
                                            <i className="fa-solid fa-edit" /> Edit Event
                                        </DropdownItem>
                                        <DropdownItem 
                                            data-testid="delete-event"
                                            onClick={deleteEvent}
                                            disabled={pending}
                                        >
                                            <i className="fa-solid fa-trash" /> Delete Event
                                        </DropdownItem>
                                    </div>
                                </>
                            )}
                        </Dropdown>
                    )}
                </div>
                {children}
                
                <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
                    <EventForm
                        title={event.title}
                        description={event.description}
                        startDate={event.startDate}
                        endDate={event.endDate}
                        onCancel={() => setIsEditing(false)}
                        onSubmit={editEvent}
                        autoFocus
                    />
                </Modal>
            </Panel>
        </div>
    );
};

export default EventDisplay;
