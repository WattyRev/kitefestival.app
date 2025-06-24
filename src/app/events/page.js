'use client'

import { Suspense } from "react";
import H1 from "../../components/ui/H1";
import EventDisplay from "../../components/EventDisplay";
import EventsContainer from "../../components/EventsContainer";
import EventForm from "../../components/EventForm";
import LoadingBar from "../../components/ui/LoadingBar";
import { css } from '../../../styled-system/css';
import { useAuth } from "../../components/global/Auth";
import ChangePollingContainer from "../../components/ChangePollingContainer";

const EventsPageContainer = ({ events: initialEvents = [] }) => {
    const { isEditor } = useAuth();

    return (
        <ChangePollingContainer>
            <EventsContainer initialEvents={initialEvents}>                {({ 
                    events,
                    isLoading,
                    createEvent,
                    editEvent,
                    deleteEvent,
                    setActiveEvent,
                }) => (
                    <Suspense>
                        <LoadingBar isLoading={isLoading} />
                        <div data-testid="events-page">
                            <H1 className={css({ paddingLeft: '16px', paddingTop: '32px' })}>
                                Event Management
                            </H1>
                            
                            {!events.length && (
                                <p className={css({ paddingLeft: '16px' })} data-testid="empty-events">
                                    No events have been created yet
                                </p>
                            )}
                            
                            {events.map((event) => (
                                <EventDisplay 
                                    key={event.id}
                                    event={event} 
                                    onDelete={deleteEvent}
                                    onEdit={editEvent}
                                    onSetActive={setActiveEvent}
                                    isActive={event.isActive}
                                />
                            ))}
                            
                            {isEditor() && (
                                <EventForm onSubmit={createEvent} />
                            )}
                        </div>
                    </Suspense>
                )}  
            </EventsContainer>
        </ChangePollingContainer>
    );
};

export default EventsPageContainer;
