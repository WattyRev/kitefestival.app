import { createContext, useEffect, useReducer, useState, useCallback } from "react";
import fetch from '../util/fetch';
import { useAlert } from "./ui/Alert";
import { useChangePolling } from "./ChangePollingContainer";

export const EventsContext = createContext({
    events: [],
    activeEvent: null,
});

export const EventsDispatchContext = createContext(null);

let lastUpdate = new Date().getTime() - 15000;

function sortEvents(events) {
    const sortedEvents = [...events];
    sortedEvents.sort((a, b) => {
        return new Date(a.startDate) - new Date(b.startDate);
    });
    return sortedEvents;
}

function buildEventsState(events) {
    const sortedEvents = sortEvents(events);
    const activeEvent = sortedEvents.find(event => event.isActive) || null;
    
    return {
        events: sortedEvents,
        activeEvent
    };
}

const EventsReducer = (state, action) => {
    switch (action.type) {
        case 'delete': {
            if (!action.id) {
                throw new Error('No id provided to delete event from state');
            }
            return buildEventsState(state.events.filter(event => event.id !== action.id));
        }
        case 'patch': {
            if (!action?.event?.id) {
                throw new Error('No id provided to patch event from state');
            }
            return buildEventsState(state.events.map(event => {
                if (event.id === action.event.id) {
                    Object.assign(event, action.event);
                }
                return event;
            }));
        }
        case 'create': {
            if (!action.event) {
                throw new Error('No event provided to create');
            }
            return buildEventsState([...state.events, action.event]);
        }
        case 'setActive': {
            if (!action.eventId) {
                throw new Error('No event ID provided to set active');
            }
            return buildEventsState(state.events.map(event => ({
                ...event,
                isActive: event.id === action.eventId
            })));
        }
        case 'refresh': {
            return action.newState;
        }
        default: {
            throw new Error(`Unhandled events action type: ${action.type}`);
        }
    }
};

const EventsContainer = ({ children, initialEvents = [] }) => {
    const [eventsData, dispatch] = useReducer(EventsReducer, {
        events: initialEvents,
        activeEvent: initialEvents.find(event => event.isActive) || null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const { openAlert } = useAlert();
    const { changes } = useChangePolling();

    const fetchEvents = async () => {
        setIsLoading(true);
        const eventsResponse = await fetch('/api/events');
        const eventsJson = await eventsResponse.json();
        const { events } = eventsJson;
        
        dispatch({
            type: 'refresh',
            newState: buildEventsState(events)
        });
        setIsLoading(false);
    };    const checkForUpdates = useCallback(async () => {
        const newerChanges = changes.filter(change => 
            new Date(change.updated).getTime() > lastUpdate && change.tablename === 'events'
        );
        if (!newerChanges.length) {
            return;
        }
        lastUpdate = new Date().getTime();
        return fetchEvents();
    }, [changes, fetchEvents]);    useEffect(() => {
        checkForUpdates();
    }, [changes, checkForUpdates]);

    const childData = {
        events: eventsData.events,
        activeEvent: eventsData.activeEvent,
        isLoading,
        createEvent: async ({ title, description, startDate, endDate }) => {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description, startDate, endDate })
            });
            if (!response.ok) {
                openAlert('Failed to create event', 'error');
                return;
            }
            const updatedEventJson = await response.json();
            const updatedEvent = updatedEventJson.events[0];
            dispatch({ type: 'create', event: updatedEvent });
        },
        deleteEvent: async (id) => {
            const response = await fetch(`/api/events/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                openAlert('Failed to delete event', 'error');
                return;
            }
            dispatch({ type: 'delete', id });
        },
        editEvent: async (event) => {
            const response = await fetch(`/api/events/${event.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ event })
            });
            if (!response.ok) {
                openAlert('Failed to update event', 'error');
                return;
            }
            dispatch({ type: 'patch', event });
        },
        setActiveEvent: async (eventId) => {
            const response = await fetch('/api/events', {
                method: 'PATCH',
                body: JSON.stringify({ activeEventId: eventId })
            });
            if (!response.ok) {
                openAlert('Failed to set active event', 'error');
                return;
            }
            dispatch({ type: 'setActive', eventId });
        }
    };

    return (
        <EventsContext.Provider value={eventsData}>
            <EventsDispatchContext.Provider value={dispatch}>
                {children?.(childData)}
            </EventsDispatchContext.Provider>
        </EventsContext.Provider>
    );
};

export default EventsContainer;
