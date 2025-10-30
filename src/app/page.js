import HomePage from "../components/HomePage";
import { getEvents } from "./api/events";

export const revalidate = 10;
export default async function Home() {
    const { events } = await getEvents({});

    return <HomePage initialEvents={events} />;
}
