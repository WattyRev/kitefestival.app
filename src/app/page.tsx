import HomePageContainer from "@/components/HomePageContainer";
import { sql } from "@vercel/postgres";

export const revalidate = 10;
export default async function Home() {
  const activitiesResponse = await sql`SELECT * FROM activities ORDER BY sortIndex ASC`;
  const activities = activitiesResponse.rows.map(activity => {
    const { id, title, description, sortIndex } = activity;
    return { id, title, description, sortIndex };
  });
  console.log('fetched')
 
  return (
    <HomePageContainer activities={activities} />
  )
}