import { css } from "../../styled-system/css";
import { useAuth } from "./global/Auth";
import Button from "./ui/Button";
import { usePrompt } from "./ui/Prompt";
import fetch from "../util/fetch";
import H2 from "./ui/H2";
import StyledLink from "./ui/StyledLink";

const EventListItem = ({ event, onDelete = () => {} }) => {
    const { isEditor } = useAuth();
    const { openPrompt } = usePrompt();

    async function deleteEvent() {
        await openPrompt(
            `Are you sure you want to delete "${event.name}"? This will also delete all activities and comments associated with it.`,
            "confirm",
        );

        await fetch(`/api/events/${event.id}`, {
            method: "DELETE",
        });

        onDelete(event.id);
    }
    return (
        <div className={css({ 
            borderBottom: "1px solid", 
            padding: "16px",
            marginBottom: "16px",
        })}>
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
                    <Button title="Delete" className="danger" onClick={deleteEvent}>
                        <i className="fa-solid fa-trash"></i>
                    </Button>
                )}
            </div>
            {event.description && event.description.split("\n").map((line, index) => (
                <p key={`${line}${index}`}>{line}</p>
            ))}
        </div>
    );
};

export default EventListItem;
