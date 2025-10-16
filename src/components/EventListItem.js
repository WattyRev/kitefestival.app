import { css } from "../../styled-system/css";
import { useAuth } from "./global/Auth";
import Button from "./ui/Button";
import { usePrompt } from "./ui/Prompt";

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

    return <div className={css({ 
        borderBottom: "1px solid",
        display: "flex",
    })}>
        <a 
            key={event.id} 
            className={css({
                padding: "16px",
                display: 'block',
                flexGrow: 1,
            })} 
            href={`/event/${event.slug}`}
        >{event.name}</a>
        {isEditor() && (
            <Button title="Delete" className="danger" onClick={deleteEvent}>
                <i className="fa-solid fa-trash"></i>
            </Button>
        )}
    </div>
}

export default EventListItem;