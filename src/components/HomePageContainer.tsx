'use client'
import H1 from "@/components/ui/H1";
import ActivityDisplay from "@/components/ActivityDisplay";
import CreateActivityButton from "@/components/CreateActivityButton";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./global/Auth";
import CreateActivityForm from "./CreateActivityForm";


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
    const { auth } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const [activities, setActivities] = useState(initialActivities);
    const [showCreateActivity, setShowCreateActivity] = useState(false);

    const fetchActivities = async () => {
      setIsLoading(true);
      const activitiesResponse = await fetch('/api/activities')
      const activitiesJson = await activitiesResponse.json();
      const { activities } = activitiesJson;
      console.log('fetchedActivities', activities);
      setActivities(activities);
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

    async function deleteActivity(id:String) {
      const response = await fetch(`/api/activities/${id}`, {
          method: 'DELETE',
          body: JSON.stringify({
              passcode: auth?.passcode
          })
      });
      if (!response.ok) {
          alert('Failed to delete activity');
          return;
      }
      const updatedActivities = activities.filter(activity => activity.id !== id);
      setActivities(updatedActivities);
    }

    async function createActivity({ title, description }: { title: string, description: string }) {
      const response = await fetch('/api/activities', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, description, passcode: auth?.passcode })
      })
      if (!response.ok) {
          alert('Failed to create activity');
          return;
      }
      const updatedActivityJson = await response.json();
      const updatedActivity = updatedActivityJson.activities[0];
      const updatedActivities = [...activities, updatedActivity];
      setActivities(updatedActivities);
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
        {!activities.length && <p>There are no activities</p>}
        {activities.map(activity => (
          <ActivityDisplay key={activity.id} activity={activity} onDelete={deleteActivity} />
        ))}
        <CreateActivityForm onSubmit={createActivity} />
      </>
    )
}

export default HomePageContainer;