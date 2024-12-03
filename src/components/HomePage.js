'use client'
import H1 from "./ui/H1";
import ActivityDisplay from "./ActivityDisplay";
import ActivitiesContainer from "./ActivitiesContainer";
import CreateActivityForm from "./CreateActivityForm";
import LoadingBar from "./ui/LoadingBar";
import { css } from '../../styled-system/css';
import { useAuth } from "./global/Auth";

const HomePageContainer = ({ activities:initialActivities }) => {
    const { isPublic } = useAuth();
    return (
        <ActivitiesContainer initialActivities={initialActivities}>
            {({ 
                scheduledActivities,
                unscheduledActivities,
                isLoading,
                createActivity,
                deleteActivity,
                scheduleActivity,
                unscheduleActivity,
                moveActivityUp,
                moveActivityDown,
            }) => (
                <>
                    <LoadingBar isLoading={isLoading} />
                    <div className={css({ padding: '8px' })} data-testid="home-page">
                        {!scheduledActivities.length && <p data-testid="empty-schedule">There&apos;s nothing happening right now</p>}
                        {scheduledActivities.map((activity, index) => (<div key={activity.id}>
                            {index === 0 && <H1>Happening Now</H1>}
                            {index === 1 && <H1>Upcoming</H1>}
                            <ActivityDisplay 
                                key={activity.id} 
                                activity={activity} 
                                onDelete={deleteActivity} 
                                onUnschedule={unscheduleActivity}
                                onMoveUp={index !== 0 ? moveActivityUp : undefined}
                                onMoveDown={index !== scheduledActivities.length - 1 ? moveActivityDown : undefined}
                            />
                        </div>))}
                        {!isPublic() && (<>
                            <H1 data-testid="unscheduled">Unscheduled Activities</H1>
                            {!unscheduledActivities.length && <p data-testid="empty-unscheduled">There are no unscheduled activities</p>}
                            {unscheduledActivities.map((activity, index) => (
                                <ActivityDisplay 
                                    key={activity.id} 
                                    activity={activity} 
                                    onDelete={deleteActivity} 
                                    onSchedule={scheduleActivity}
                                    onMoveUp={index !== 0 ? moveActivityUp : undefined}
                                    onMoveDown={index !== unscheduledActivities.length - 1 ? moveActivityDown : undefined}
                                />
                            ))}
                            <CreateActivityForm onSubmit={createActivity} />
                        </>)}
                    </div>
                </>
            )}  
        </ActivitiesContainer>
    )
}

export default HomePageContainer;