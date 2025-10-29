import { css } from "../../styled-system/css";
import { useAuth } from "./global/Auth";
import { usePrompt } from "./ui/Prompt";
import H2 from "./ui/H2";
import StyledLink from "./ui/StyledLink";
import Panel from "./ui/Panel";
import Dropdown, { DropdownItem } from "./ui/Dropdown";
import PlainButton from "./ui/PlainButton";
import { useState } from "react";
import Modal from "./ui/Modal";
import EventForm from "./EventForm";
import { deleteEvent as deleteEventApi } from "../app/api/events";

const EventListItem = ({ event, onDelete = () => {}, onEdit = () => {} }) => {
    const { isEditor } = useAuth();
    const { openPrompt } = usePrompt();
    const [pending, setPending] = useState(false);
    const [isEditingEvent, setIsEditingEvent] = useState(false);

    async function deleteEvent() {
        await openPrompt(
            `Are you sure you want to delete "${event.name}"? This will also delete all activities and comments associated with it.`,
            "confirm",
        );

        setPending(true);

        await deleteEventApi(event.id);

        setPending(false);

        onDelete(event.id);
    }
    return (
        <Panel>
            <div
                className={css({
                    display: "flex",
                    alignItems: "center",
                })}
            >
                <StyledLink
                    key={event.id}
                    className={css({
                        display: "block",
                        flexGrow: 1,
                    })}
                    href={`/event/${event.slug}`}
                >
                    <H2>{event.name}</H2>
                </StyledLink>
                {isEditor() && (
                    <Dropdown
                        dropdownContent={() => (
                            <>
                                <DropdownItem
                                    data-testid="edit-event"
                                    onClick={() => setIsEditingEvent(true)}
                                    disabled={pending}
                                >
                                    <i className="fa-solid fa-pen"></i> Edit
                                    Event
                                </DropdownItem>
                                <DropdownItem
                                    data-testid="delete-event"
                                    onClick={deleteEvent}
                                    disabled={pending}
                                >
                                    <i className="fa-solid fa-trash"></i> Delete
                                    Event
                                </DropdownItem>
                            </>
                        )}
                    >
                        {({ open, close, isOpen }) => (
                            <PlainButton
                                data-testid="event-dropdown"
                                className={css({
                                    cursor: "pointer",
                                })}
                                onClick={isOpen ? close : open}
                            >
                                <i className="fa-solid fa-ellipsis"></i>
                            </PlainButton>
                        )}
                    </Dropdown>
                )}
            </div>
            {event.description &&
                event.description
                    .split("\n")
                    .map((line, index) => (
                        <p key={`${line}${index}`}>{line}</p>
                    ))}
            <Modal
                isOpen={isEditingEvent}
                onClose={() => setIsEditingEvent(false)}
            >
                <EventForm
                    initialEvent={event}
                    isEdit={true}
                    onCancel={() => setIsEditingEvent(false)}
                    onSubmit={(savedEvent) => {
                        setIsEditingEvent(false);
                        onEdit(savedEvent);
                    }}
                />
            </Modal>
        </Panel>
    );
};

export default EventListItem;
