'use client'
import H1 from "@/components/ui/H1";
import ActivityDisplay from "@/components/ActivityDisplay";
import CreateActivityButton from "@/components/CreateActivityButton";
import { useEffect, useState } from "react";


export interface Activity {
    id: string;
    title: string;
    description: string;
    sortIndex: number;
  }

const HomePageContainer = ({ activities:initialActivities }: { activities: Activity[]}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [unscheduledActivities/*, setUnscheduledActivities*/] = useState(initialActivities);
    // const [schedule] = useState({});

    useEffect(() => {
      (async () => {
        setIsLoading(true);
        // const activitiesResponse = await fetch('/api/activities')
        // const activitiesJson = await activitiesResponse.json();
        // const { activities } = activitiesJson;
        // console.log('fetchedActivities', activities);
        // setUnscheduledActivities(activities);
        setIsLoading(false);
      })()
    }, [])

    return (
      <>
        {isLoading && <p>Loading...</p>}
        <H1>Happening Now</H1>
        <p>There&apos;s nothing happening right now</p>

        <H1>Unscheduled Activities</H1>
        {!unscheduledActivities.length && <p>There are no activities</p>}
        {unscheduledActivities.map(activity => (
          <ActivityDisplay key={activity.id} activity={activity} />
        ))}
        <CreateActivityButton />
      </>
    )
}

export default HomePageContainer;