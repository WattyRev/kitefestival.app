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

export interface Change {
  tablename: string;
  updated: number;
}

let lastUpdate = new Date().getTime();

const HomePageContainer = ({ activities:initialActivities }: { activities: Activity[]}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [unscheduledActivities, setUnscheduledActivities] = useState(initialActivities);

    const fetchActivities = async () => {
      setIsLoading(true);
      const activitiesResponse = await fetch('/api/activities')
      const activitiesJson = await activitiesResponse.json();
      const { activities } = activitiesJson;
      console.log('fetchedActivities', activities);
      setUnscheduledActivities(activities);
      setIsLoading(false);
    }

    const checkForUpdates = async () => {
      const changesResponse = await fetch('/api/changes');
      const changesJson = await changesResponse.json();
      const { changes }: { changes: Change[] } = changesJson;
      const newerChanges = changes.filter(change => new Date(change.updated).getTime() > lastUpdate);
      if (!newerChanges.length) {
        return;
      }
      lastUpdate = new Date().getTime();
      const refreshPromises = newerChanges.map(change => {
        console.log({
          lastUpdate,
          lastUpdateISO: new Date(lastUpdate).toISOString(),
          newerChange: new Date(change.updated).getTime(),
          newerChangeOrig: change.updated
        })
        if (change.tablename === 'activities') {
          return fetchActivities();
        }
        return Promise.resolve();
      });
      return Promise.all(refreshPromises);
    }

    useEffect(() => {
      const interval = setInterval(() => {
        checkForUpdates();
      }, 5000);
      return () => clearInterval(interval);
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