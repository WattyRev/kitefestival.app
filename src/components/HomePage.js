'use client'
import { Suspense, useState } from "react";
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
import { closestCenter, DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import ActivityDrop from "./ActivityDrop";
import ActivityDropZone from "./ActivityDropZone";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

const HomePageContainer = ({ activities:initialActivities }) => {
    const { isPublic, isEditor } = useAuth();
    const [ activelyDraggedId, setActivelyDraggedId ] = useState(null);
    const sensors = useSensors(
        useSensor(TouchSensor),
        useSensor(MouseSensor),
    );
    return (
        <ChangePollingContainer>
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ 
                    activities,
                    scheduledActivities,
                    unscheduledActivities,
                    isLoading: isLoadingActivities,
                    createActivity,
                    editActivity,
                    deleteActivity,
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
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragStart={event => {
                                                setActivelyDraggedId(event.active.id);
                                            }}
                                            onDragEnd={event => {
                                                setActivelyDraggedId(null);
                                                const { active, over } = event;
                                                const activityId = active.id;
                                                const {bucket, index} = over.data.current;
                                                moveActivity(activityId, bucket, index);
                                            }}
                                            modifiers={[restrictToVerticalAxis]}
                                        >
                                            {!scheduledActivities.length && (<>
                                                <p className={css({ paddingLeft: '16px'})} data-testid="empty-schedule">There&apos;s nothing happening right now</p>
                                                {isEditor() && activities.length && <ActivityDropZone bucket="schedule" index={0} id="schedule-0" text="Drag activities here to schedule them" />}
                                            </>)}
                                            {scheduledActivities.map((activity, index) => (
                                                <div key={activity.id}>
                                                    {index === 0 && <H1 className={css({ paddingLeft: '16px'})}>Happening Now</H1>}
                                                    {index === 1 && <H2 className={css({ paddingLeft: '16px', paddingTop: "16px"})}>Upcoming</H2>}
                                                    {isEditor () && activelyDraggedId !== scheduledActivities[index - 1]?.id && <ActivityDrop 
                                                        bucket="schedule"
                                                        index={activity.scheduleIndex}
                                                        id={`schedule-${activity.scheduleIndex}`}
                                                    />}
                                                    <ActivityDisplay 
                                                        key={activity.id} 
                                                        activity={activity} 
                                                        onDelete={deleteActivity} 
                                                        onEdit={editActivity}
                                                        onUnschedule={id => moveActivity(id, 'unschedule', 0)}
                                                        onMoveUp={index !== 0 ? id => moveActivity(id, 'schedule', activity.scheduleIndex - 1) : undefined}
                                                        onMoveDown={index !== scheduledActivities.length - 1 ? id => moveActivity(id, 'schedule', activity.scheduleIndex + 2) : undefined}
                                                        allowHideDescription={index !== 0}
                                                    >
                                                        <Comments 
                                                            activity={activity}
                                                            comments={commentsByActivityId[activity.id]}
                                                            onCreate={message => createComment({ message, activityId: activity.id })}
                                                            onDelete={deleteComment}
                                                            onEdit={editComment}
                                                        />
                                                    </ActivityDisplay>
                                                    {index === scheduledActivities.length - 1 && activity.id !== activelyDraggedId &&  isEditor() && <ActivityDrop 
                                                        bucket="schedule"
                                                        index={activity.scheduleIndex + 1}
                                                        id={`schedule-${activity.scheduleIndex + 1}`}
                                                    />}
                                                </div>
                                            ))}
                                            {!isPublic() && (<>
                                                <H1 data-testid="unscheduled" className={css({ paddingLeft: '16px', paddingTop: '32px'})}>Unscheduled Activities</H1>
                                                {!unscheduledActivities.length && (<>
                                                    <p data-testid="empty-unscheduled" className={css({ paddingLeft: '16px'})}>There are no unscheduled activities</p>
                                                    {isEditor() && activities.length && <ActivityDropZone 
                                                        bucket="unschedule"
                                                        index={0}
                                                        id={"unschedule-0"}
                                                        text="Drag activities here to unschedule them"
                                                    />}
                                                </>)}
                                                {unscheduledActivities.map((activity, index) => (
                                                    <div key={activity.id} >
                                                        {isEditor() && activelyDraggedId !== unscheduledActivities[index - 1]?.id && <ActivityDrop 
                                                            bucket="unschedule"
                                                            index={activity.sortIndex}
                                                            id={`unschedule-${activity.sortIndex}`}
                                                        />}
                                                        <ActivityDisplay 
                                                            activity={activity} 
                                                            onDelete={deleteActivity} 
                                                            onSchedule={id => moveActivity(id, 'schedule', scheduledActivities.length || 0)}
                                                            onEdit={editActivity}
                                                            onMoveUp={index !== 0 ? id => moveActivity(id, 'unschedule', activity.sortIndex - 1) : undefined}
                                                            onMoveDown={index !== unscheduledActivities.length - 1 ? id => moveActivity(id, 'unschedule', activity.sortIndex + 2) : undefined}
                                                        >
                                                            <Comments 
                                                                activity={activity}
                                                                comments={commentsByActivityId[activity.id]}
                                                                onCreate={message => createComment({ message, activityId: activity.id })}
                                                                onDelete={deleteComment}
                                                                onEdit={editComment}
                                                            />
                                                        </ActivityDisplay>
                                                        {index === unscheduledActivities.length - 1 && activity.id !== activelyDraggedId && isEditor() && <ActivityDrop 
                                                            bucket="unschedule"
                                                            index={activity.sortIndex + 1}
                                                            id={`unschedule-${activity.sortIndex + 1}`}
                                                        />}
                                                    </div>
                                                ))}
                                            </>)}
                                        </DndContext>
                                        <ActivityForm onSubmit={createActivity} />
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