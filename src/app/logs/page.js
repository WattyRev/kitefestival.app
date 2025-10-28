import LogsPage from "../../components/LogsPage";
import { getLogs } from "../api/actionLog";
import { getEvents } from "../api/events";

export const revalidate = 10;

export default async function Page() {
    const logs = await getLogs({});
    const events = await getEvents({ columns: ["id", "name"] });

    return <LogsPage logs={logs} events={events} />;
}
