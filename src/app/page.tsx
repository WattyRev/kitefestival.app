import HomePageContainer from "@/components/HomePageContainer";
import { sql } from "@vercel/postgres";

export default async function Home() {
  const activitiesResponse = await sql`SELECT * FROM activities ORDER BY sortIndex ASC`;
  const activities = activitiesResponse.rows;
  const schedule: string[] = [];
 
  return (
    <HomePageContainer activities={activities} schedule={schedule} />
  )
}