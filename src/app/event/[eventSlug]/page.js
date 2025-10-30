import EventPage from "../../../components/EventPage";
import { getActivities } from "../../api/activities";
import { getMusicLibrary } from "../../api/musicLibrary";
import { getEvents } from "../../api/events";

export const revalidate = 10;
export default async function Event({ params }) {
    const { eventSlug } = params;
    const { events } = await getEvents({
        slug: eventSlug,
        columns: ["id", "name", "slug"],
    });
    const [event] = events;
    const [activitiesResponse, musicResponse] = await Promise.all([
        getActivities(event.id),
        getMusicLibrary(),
    ]);

    return (
        <EventPage
            event={event}
            activities={activitiesResponse.activities}
            musicLibrary={musicResponse.musicLibrary}
        />
    );
}
