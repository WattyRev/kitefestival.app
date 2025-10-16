'use client'

import { useState } from "react";
import EventForm from "./EventForm";
import H1 from "./ui/H1";
import EventListItem from "./EventListItem";

function HomePage({initialEvents}) {
    const [events, setEvents] = useState(initialEvents);
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
                <EventListItem key={event.id} event={event} onDelete={() => setEvents(events.filter(e => e.id !== event.id))} />
            ))}
            <EventForm onSubmit={event => setEvents([...events, event])}/>
        </div>
    );
}

export default HomePage;