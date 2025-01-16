'use client'
import { Suspense } from "react";
import H1 from "./ui/H1";
import ActivityDisplay from "./ActivityDisplay";
import ActivitiesContainer from "./ActivitiesContainer";
import ActivityForm from "./ActivityForm";
import LoadingBar from "./ui/LoadingBar";
import { css } from '../../styled-system/css';
import { useAuth } from "./global/Auth";
import ChangePollingContainer from "./ChangePollingContainer";
import CommentsContainer from "./CommentsContainer";
import Comments from "./Comments";
import H2 from "./ui/H2";
import { PaneProvider } from "./ui/Pane";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import ActivityDrop from "./ActivityDrop";

const HomePageContainer = ({ activities:initialActivities }) => {
    const { isPublic } = useAuth();
    return (
        <ChangePollingContainer>
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ 
                    scheduledActivities,
                    unscheduledActivities,
                    isLoading: isLoadingActivities,
                    createActivity,
                    editActivity,
                    deleteActivity,
                    scheduleActivity,
                    unscheduleActivity,
                    moveActivityUp,
                    moveActivityDown,
                    moveActivity,
                }) => (
                    <CommentsContainer>
                        {({
                            commentsByActivityId,
                            isLoading: isLoadingComments,
                            createComment,
                            deleteComment,
                            editComment
                        }) => (
                            <Suspense>
                                <PaneProvider>
                                    <LoadingBar isLoading={isLoadingActivities || isLoadingComments} />
                                    <div data-testid="home-page">
                                        <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
                                            {!scheduledActivities.length && <p className={css({ paddingLeft: '16px'})} data-testid="empty-schedule">There&apos;s nothing happening right now</p>}
                                            {scheduledActivities.map((activity, index) => (
                                                <div key={activity.id}>
                                                    {index === 0 && <H1 className={css({ paddingLeft: '16px'})}>Happening Now</H1>}
                                                    {index === 1 && <H2 className={css({ paddingLeft: '16px', paddingTop: "16px"})}>Upcoming</H2>}
                                                    <ActivityDrop 
                                                        onDrop={activityId => moveActivity(activityId, 'schedule', activity.scheduleIndex)} 
                                                        disableIds={[activity.id, scheduledActivities[index - 1]?.id]} 
                                                    />
                                                    <ActivityDisplay 
                                                        key={activity.id} 
                                                        activity={activity} 
                                                        onDelete={deleteActivity} 
                                                        onEdit={editActivity}
                                                        onUnschedule={unscheduleActivity}
                                                        onMoveUp={index !== 0 ? moveActivityUp : undefined}
                                                        onMoveDown={index !== scheduledActivities.length - 1 ? moveActivityDown : undefined}
                                                    >
                                                        <Comments 
                                                            activity={activity}
                                                            comments={commentsByActivityId[activity.id]}
                                                            onCreate={message => createComment({ message, activityId: activity.id })}
                                                            onDelete={deleteComment}
                                                            onEdit={editComment}
                                                        />
                                                    </ActivityDisplay>
                                                    {index === scheduledActivities.length - 1 && <ActivityDrop 
                                                        onDrop={activityId => moveActivity(activityId, 'schedule', activity.scheduleIndex + 1)} 
                                                        disableIds={[activity.id]}
                                                    />}
                                                        
                                                </div>
                                            ))}
                                            {!isPublic() && (<>
                                                <H1 data-testid="unscheduled" className={css({ paddingLeft: '16px', paddingTop: '32px'})}>Unscheduled Activities</H1>
                                                {!unscheduledActivities.length && <p data-testid="empty-unscheduled" className={css({ paddingLeft: '16px'})}>There are no unscheduled activities</p>}
                                                {unscheduledActivities.map((activity, index) => (
                                                    <div key={activity.id} >
                                                        <ActivityDrop 
                                                            onDrop={activityId => moveActivity(activityId, 'unschedule', activity.sortIndex)}
                                                            disableIds={[activity.id, unscheduledActivities[index - 1]?.id]}
                                                        />
                                                        <ActivityDisplay 
                                                            activity={activity} 
                                                            onDelete={deleteActivity} 
                                                            onSchedule={scheduleActivity}
                                                            onEdit={editActivity}
                                                            onMoveUp={index !== 0 ? moveActivityUp : undefined}
                                                            onMoveDown={index !== unscheduledActivities.length - 1 ? moveActivityDown : undefined}
                                                        >
                                                            <Comments 
                                                                activity={activity}
                                                                comments={commentsByActivityId[activity.id]}
                                                                onCreate={message => createComment({ message, activityId: activity.id })}
                                                                onDelete={deleteComment}
                                                                onEdit={editComment}
                                                            />
                                                        </ActivityDisplay>
                                                        {index === unscheduledActivities.length - 1 && <ActivityDrop 
                                                            onDrop={activityId => moveActivity(activityId, 'unschedule', activity.sortIndex + 1)}
                                                            disableIds={[activity.id]}
                                                        />}
                                                    </div>
                                                ))}
                                                <ActivityForm onSubmit={createActivity} />
                                            </>)}
                                        </DndProvider>
                                    </div>
                                </PaneProvider>
                            </Suspense>
                        )}
                    </CommentsContainer>
                )}  
            </ActivitiesContainer>
        </ChangePollingContainer>
    )
}

export default HomePageContainer;