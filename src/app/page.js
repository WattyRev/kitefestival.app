import HomePage from "../components/HomePage";
import { sql } from "@vercel/postgres";

export const revalidate = 10;
export default async function Home() {
  const activitiesResponse = await sql`SELECT * FROM activities ORDER BY scheduleIndex ASC, sortIndex ASC`;
  const activities = activitiesResponse.rows.map(activity => {
    const { id, title, description, sortindex, scheduleindex } = activity;
    return { id, title, description, sortIndex: sortindex, scheduleIndex: scheduleindex };
  });
 
  return (
    <HomePage activities={activities} />
  )
}