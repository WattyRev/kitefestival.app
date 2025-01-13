'use client'
import H1 from "./ui/H1";
import ActivityDisplay from "./ActivityDisplay";
import ActivitiesContainer from "./ActivitiesContainer";
import CreateActivityForm from "./CreateActivityForm";
import LoadingBar from "./ui/LoadingBar";
import { css } from '../../styled-system/css';
import { useAuth } from "./global/Auth";
import ChangePollingContainer from "./ChangePollingContainer";
import CommentsContainer from "./CommentsContainer";
import Comments from "./Comments";
import H2 from "./ui/H2";

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
                    deleteActivity,
                    scheduleActivity,
                    unscheduleActivity,
                    moveActivityUp,
                    moveActivityDown,
                }) => (
                    <CommentsContainer>
                        {({
                            commentsByActivityId,
                            isLoading: isLoadingComments,
                            createComment,
                            deleteComment,
                            editComment
                        }) => (
                            <>
                                <LoadingBar isLoading={isLoadingActivities || isLoadingComments} />
                                <div data-testid="home-page">
                                    {!scheduledActivities.length && <p className={css({ paddingLeft: '16px'})} data-testid="empty-schedule">There&apos;s nothing happening right now</p>}
                                    {scheduledActivities.map((activity, index) => (<div key={activity.id}>
                                        {index === 0 && <H1 className={css({ paddingLeft: '16px'})}>Happening Now</H1>}
                                        {index === 1 && <H2 className={css({ paddingLeft: '16px', paddingTop: "16px"})}>Upcoming</H2>}
                                        <ActivityDisplay 
                                            key={activity.id} 
                                            activity={activity} 
                                            onDelete={deleteActivity} 
                                            onUnschedule={unscheduleActivity}
                                            onMoveUp={index !== 0 ? moveActivityUp : undefined}
                                            onMoveDown={index !== scheduledActivities.length - 1 ? moveActivityDown : undefined}
                                        >
                                            <Comments 
                                                comments={commentsByActivityId[activity.id]}
                                                onCreate={message => createComment({ message, activityId: activity.id })}
                                                onDelete={deleteComment}
                                                onEdit={editComment}
                                            />
                                        </ActivityDisplay>
                                    </div>))}
                                    {!isPublic() && (<>
                                        <H1 data-testid="unscheduled" className={css({ paddingLeft: '16px', paddingTop: '32px'})}>Unscheduled Activities</H1>
                                        {!unscheduledActivities.length && <p data-testid="empty-unscheduled" className={css({ paddingLeft: '16px'})}>There are no unscheduled activities</p>}
                                        {unscheduledActivities.map((activity, index) => (
                                            <ActivityDisplay 
                                                key={activity.id} 
                                                activity={activity} 
                                                onDelete={deleteActivity} 
                                                onSchedule={scheduleActivity}
                                                onMoveUp={index !== 0 ? moveActivityUp : undefined}
                                                onMoveDown={index !== unscheduledActivities.length - 1 ? moveActivityDown : undefined}
                                            >
                                                <Comments 
                                                    comments={commentsByActivityId[activity.id]}
                                                    onCreate={message => createComment({ message, activityId: activity.id })}
                                                    onDelete={deleteComment}
                                                    onEdit={editComment}
                                                />
                                            </ActivityDisplay>
                                        ))}
                                        <CreateActivityForm onSubmit={createActivity} />
                                    </>)}
                                </div>
                            </>
                        )}
                    </CommentsContainer>
                )}  
            </ActivitiesContainer>
        </ChangePollingContainer>
    )
}

export default HomePageContainer;