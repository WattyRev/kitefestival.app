import HomePage from "../components/HomePage";
import { sql } from "@vercel/postgres";

export const revalidate = 10;
export default async function Home() {
    const eventsResponse = await sql`SELECT * FROM events ORDER BY id ASC`;
    const events = eventsResponse.rows.map((event) => {
        const { id, name, slug } = event;
        return {
            id,
            name,
            slug
        };
    })

    return <HomePage initialEvents={events} />;
}