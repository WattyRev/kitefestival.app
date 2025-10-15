import EventPage from "../../../components/EventPage";
import { sql } from "@vercel/postgres";

export const revalidate = 10;
export default async function Event({ params }) {
    const { eventSlug } = params;
    const eventsResponse = await sql`SELECT * FROM events WHERE slug = ${eventSlug}`;
    const event = {
        id: eventsResponse.rows[0].id,
        name: eventsResponse.rows[0].name,
        slug: eventsResponse.rows[0].slug
    }
    const activitiesPromise = sql`SELECT * FROM activities WHERE event_id = ${event.id} ORDER BY scheduleIndex ASC, sortIndex ASC`;
    const musicLibraryPromise = sql`SELECT * FROM musiclibrary ORDER BY id ASC`;
    const [activitiesResponse, musicLibraryResponse] = await Promise.all([
        activitiesPromise,
        musicLibraryPromise,
    ]);
    const activities = activitiesResponse.rows.map((activity) => {
        const { id, title, description, sortindex, scheduleindex, music, event_id } =
            activity;
        return {
            id,
            title,
            description,
            music: parseMusic(music),
            sortIndex: sortindex,
            scheduleIndex: scheduleindex,
            eventId: event_id,
        };
    });

    const musicLibrary = musicLibraryResponse.rows.map((music) => {
        const { id, value } = music;
        return {
            id,
            value,
        };
    });

    return <EventPage event={event} activities={activities} musicLibrary={musicLibrary} />;
}

function parseMusic(music) {
    try {
        return JSON.parse(music);
    } catch (error) {
        return [music];
    }
}
