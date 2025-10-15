import { css } from "../../styled-system/css";
import H1 from "./ui/H1";

const listStyle = css({
    padding: "8px",
    display: 'block',
    borderBottom: "1px solid"
})

function HomePage({events}) {
    if (!events.length) {
        <p
            className={css({
                paddingLeft: {
                    base: "12px",
                    sm: "16px",
                },
            })}
            data-testid="empty-events"
        >
            There are no events right now
        </p>
    }
    return (
        <div>
            <H1>Events</H1>
            {events.map((event) => (
                <a key={event.id} className={listStyle} href={`/event/${event.slug}`}>{event.name}</a>
            ))}
        </div>
    );
}

export default HomePage;