import HomePage from "../components/HomePage";
import { sql } from "@vercel/postgres";

export const revalidate = 10;
export default async function Home() {
    const activitiesPromise = sql`SELECT * FROM activities ORDER BY scheduleIndex ASC, sortIndex ASC`;
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
        };
    });

    const musicLibrary = musicLibraryResponse.rows.map((music) => {
        const { id, value } = music;
        return {
            id,
            value,
        };
    });

    return <HomePage activities={activities} musicLibrary={musicLibrary} />;
}

function parseMusic(music) {
    try {
        return JSON.parse(music);
    } catch (error) {
        return [music];
    }
}
