'use client'
import H1 from "./ui/H1";
import ActivityDisplay from "./ActivityDisplay";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./global/Auth";
import CreateActivityForm from "./CreateActivityForm";
import LoadingBar from "./ui/LoadingBar";
import { css } from '../../styled-system/css';

let lastUpdate = new Date().getTime() - 15000;

const HomePageContainer = ({ activities:initialActivities }) => {
    const { auth } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const [activities, setActivities] = useState(initialActivities);

    const fetchActivities = async () => {
      setIsLoading(true);
      const activitiesResponse = await fetch('/api/activities')
      const activitiesJson = await activitiesResponse.json();
      const { activities } = activitiesJson;
      setActivities(activities);
      setIsLoading(false);
    }

    const checkForUpdates = async () => {
      const changesResponse = await fetch('/api/changes');
      const changesJson = await changesResponse.json();
      const { changes } = changesJson;
      const newerChanges = changes.filter(change => new Date(change.updated).getTime() > lastUpdate);
      if (!newerChanges.length) {
        return;
      }
      lastUpdate = new Date().getTime();
      const refreshPromises = newerChanges.map(change => {
        if (change.tablename === 'activities') {
          return fetchActivities();
        }
        return Promise.resolve();
      });
      return Promise.all(refreshPromises);
    }

    async function deleteActivity(id) {
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

    async function createActivity({ title, description }) {
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
      checkForUpdates();
      const interval = setInterval(() => {
        checkForUpdates();
      }, 5000);
      return () => clearInterval(interval);
    }, [])

    return (
      <>
        <LoadingBar isLoading={isLoading} />
        <div className={css({ padding: '8px' })}>
          <H1>Happening Now</H1>
          <p>There&apos;s nothing happening right now</p>

          <H1>Unscheduled Activities</H1>
          {!activities.length && <p>There are no activities</p>}
          {activities.map(activity => (
            <ActivityDisplay key={activity.id} activity={activity} onDelete={deleteActivity} />
          ))}
          <CreateActivityForm onSubmit={createActivity} />
        </div>
      </>
    )
}

export default HomePageContainer;