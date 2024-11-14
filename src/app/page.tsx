import HomePageContainer from "@/components/HomePageContainer";

export interface ActivitiesHash {
  [key: string]: {
    title: string;
    description: string;
  }
}

export default async function Home() {
  const activities: ActivitiesHash = {} // await kv.hgetall('activities') || {};
  const schedule: string[] = [];
 
  return (
    <HomePageContainer activities={activities} schedule={schedule} />
  )
}