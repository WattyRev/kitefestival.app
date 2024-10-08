'use client'
import H1 from "@/components/ui/H1";
import ActivityDisplay from "@/components/ActivityDisplay";
import CreateActivityButton from "@/components/CreateActivityButton";
import { ActivitiesHash } from "@/app/page";
import { useState } from "react";


export interface Activity {
    id: string;
    title: string;
    description: string;
  }

const HomePageContainer = ({
    activities: initialActivities,
    schedule: initialSchedule,
}: {
    activities: ActivitiesHash,
    schedule: string[],
}) => {
    const [activities] = useState(initialActivities);
    const [schedule] = useState(initialSchedule);

    const unscheduledActivities = Object.entries(activities)
    .reduce((accumulated: Activity[], [id, activity]) => {
      if (schedule.includes(id)) {
        return accumulated;
      }
      return [...accumulated, { id, ...activity }]
    }, []);

    return (
      <>
        <H1>Happening Now</H1>
        {!schedule.length && <p>There&apos;s nothing happening right now</p>}
        {!!schedule.length && (
          <>
            <H1>Up Next</H1>
            <H1>Later</H1>
          </>
        )}

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