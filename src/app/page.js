import HomePage from "../components/HomePage";
import { sql } from "@vercel/postgres";

export const revalidate = 10;
export default async function Home() {
    const activitiesResponse =
        await sql`SELECT * FROM activities ORDER BY scheduleIndex ASC, sortIndex ASC`;
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

    return <HomePage activities={activities} />;
}

function parseMusic(music) {
    try {
        return JSON.parse(music);
    } catch (error) {
        return [music];
    }
}
