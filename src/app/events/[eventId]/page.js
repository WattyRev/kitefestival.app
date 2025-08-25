import HomePage from "../../../components/HomePage";
import { sql } from "@vercel/postgres";

export const revalidate = 0;

export default async function EventPage({ params }) {
    const { eventId } = params;

    // Fetch activities scoped to this event
    const activitiesPromise = sql`
        SELECT * FROM activities 
        WHERE event_id = ${eventId}
        ORDER BY scheduleIndex ASC, sortIndex ASC`;
    const musicLibraryPromise = sql`SELECT * FROM musiclibrary ORDER BY id ASC`;
    const [activitiesResponse, musicLibraryResponse] = await Promise.all([
        activitiesPromise,
        musicLibraryPromise,
    ]);

    const activities = activitiesResponse.rows.map((activity) => {
        const { id, title, description, sortindex, scheduleindex, music } =
            activity;
        return {
            id,
            title,
            description,
            music: parseMusic(music),
            sortIndex: sortindex,
            scheduleIndex: scheduleindex,
            eventId,
        };
    });

    const musicLibrary = musicLibraryResponse.rows.map((music) => {
        const { id, value } = music;
        return {
            id,
            value,
        };
    });

    return (
        <HomePage
            activities={activities}
            musicLibrary={musicLibrary}
            eventId={eventId}
        />
    );
}

function parseMusic(music) {
    try {
        return JSON.parse(music);
    } catch (error) {
        return [music];
    }
}
