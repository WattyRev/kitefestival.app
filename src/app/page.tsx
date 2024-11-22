import HomePageContainer from "@/components/HomePageContainer";
import { sql } from "@vercel/postgres";
import { Activity } from "./api/activities/route";

export const revalidate = 10;
export default async function Home() {
  const activitiesResponse = await sql`SELECT * FROM activities ORDER BY sortIndex ASC`;
  const activities: Activity[] = activitiesResponse.rows.map(activity => {
    const { id, title, description, sortindex, scheduleindex } = activity;
    return { id, title, description, sortIndex: sortindex, scheduleIndex: scheduleindex };
  });
 
  return (
    <HomePageContainer activities={activities} />
  )
}