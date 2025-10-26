"use client";
import { Suspense } from "react";
import H1 from "./ui/H1";
import ActivityDisplay from "./ActivityDisplay";
import ActivitiesContainer from "./ActivitiesContainer";
import ActivityForm from "./ActivityForm";
import LoadingBar from "./ui/LoadingBar";
import { css } from "../../styled-system/css";
import { useAuth } from "./global/Auth";
import ChangePollingContainer from "./ChangePollingContainer";
import CommentsContainer from "./CommentsContainer";
import Comments from "./Comments";
import H2 from "./ui/H2";
import { PaneProvider } from "./ui/Pane";
import UndoButton from "./ui/UndoButton";
import MusicLibraryContainer from "./MusicLibraryContainer";

const EventPageContainer = ({
    event,
    activities: initialActivities,
    musicLibrary: initialMusicLibrary,
}) => {
    const { isEditor } = useAuth();
    return (
        <ChangePollingContainer>
            <H1>{event.name}</H1>
            <MusicLibraryContainer initialMusicLibrary={initialMusicLibrary}>
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({
                        scheduledActivities,
                        unscheduledActivities,
                        isLoading: isLoadingActivities,
                        createActivity,
                        editActivity,
                        deleteActivity,
                        moveActivity,
                        undoLastMove,
                        hasUndo,
                    }) => (
                        <CommentsContainer>
                            {({
                                commentsByActivityId,
                                isLoading: isLoadingComments,
                                createComment,
                                deleteComment,
                                editComment,
                            }) => (
                                <Suspense>
                                    <PaneProvider>
                                        <LoadingBar
                                            isLoading={
                                                isLoadingActivities ||
                                                isLoadingComments
                                            }
                                        />
                                        <div data-testid="home-page">
                                            {!scheduledActivities.length && (
                                                <>
                                                    <p
                                                        className={css({
                                                            paddingLeft: {
                                                                base: "12px",
                                                                sm: "16px",
                                                            },
                                                        })}
                                                        data-testid="empty-schedule"
                                                    >
                                                        There&apos;s nothing
                                                        happening right now
                                                    </p>
                                                </>
                                            )}
                                            {scheduledActivities.map(
                                                (activity, index) => (
                                                    <div key={activity.id}>
                                                        {" "}
                                                        {index === 0 && (
                                                            <H1
                                                                className={css({
                                                                    paddingLeft:
                                                                        {
                                                                            base: "12px",
                                                                            sm: "16px",
                                                                        },
                                                                })}
                                                            >
                                                                Happening Now
                                                            </H1>
                                                        )}
                                                        {index === 1 && (
                                                            <H2
                                                                className={css({
                                                                    paddingLeft:
                                                                        {
                                                                            base: "12px",
                                                                            sm: "16px",
                                                                        },
                                                                    paddingTop:
                                                                        {
                                                                            base: "12px",
                                                                            sm: "16px",
                                                                        },
                                                                })}
                                                            >
                                                                Upcoming
                                                            </H2>
                                                        )}
                                                        <ActivityDisplay
                                                            key={activity.id}
                                                            activity={activity}
                                                            onDelete={
                                                                deleteActivity
                                                            }
                                                            onEdit={
                                                                editActivity
                                                            }
                                                            onComplete={
                                                                activity.scheduleIndex ===
                                                                0
                                                                    ? (id) =>
                                                                          moveActivity(
                                                                              id,
                                                                              "unschedule",
                                                                              unscheduledActivities.length,
                                                                          )
                                                                    : null
                                                            }
                                                            onUnschedule={(
                                                                id,
                                                            ) =>
                                                                moveActivity(
                                                                    id,
                                                                    "unschedule",
                                                                    0,
                                                                )
                                                            }
                                                            onMoveUp={
                                                                index !== 0
                                                                    ? (id) =>
                                                                          moveActivity(
                                                                              id,
                                                                              "schedule",
                                                                              activity.scheduleIndex -
                                                                                  1,
                                                                          )
                                                                    : undefined
                                                            }
                                                            onMoveTop={
                                                                index !== 0
                                                                    ? (id) =>
                                                                          moveActivity(
                                                                              id,
                                                                              "schedule",
                                                                              0,
                                                                          )
                                                                    : undefined
                                                            }
                                                            onMoveDown={
                                                                index !==
                                                                scheduledActivities.length -
                                                                    1
                                                                    ? (id) =>
                                                                          moveActivity(
                                                                              id,
                                                                              "schedule",
                                                                              activity.scheduleIndex +
                                                                                  2,
                                                                          )
                                                                    : undefined
                                                            }
                                                            onMoveBottom={
                                                                index !==
                                                                scheduledActivities.length -
                                                                    1
                                                                    ? (id) =>
                                                                          moveActivity(
                                                                              id,
                                                                              "schedule",
                                                                              scheduledActivities.length,
                                                                          )
                                                                    : undefined
                                                            }
                                                            onMoveTo={(index) =>
                                                                moveActivity(
                                                                    activity.id,
                                                                    "schedule",
                                                                    parseInt(
                                                                        index,
                                                                    ),
                                                                )
                                                            }
                                                            allowHideDescription={
                                                                index !== 0
                                                            }
                                                        >
                                                            <Comments
                                                                activity={
                                                                    activity
                                                                }
                                                                comments={
                                                                    commentsByActivityId[
                                                                        activity
                                                                            .id
                                                                    ]
                                                                }
                                                                onCreate={(
                                                                    message,
                                                                ) =>
                                                                    createComment(
                                                                        {
                                                                            message,
                                                                            activityId:
                                                                                activity.id,
                                                                        },
                                                                    )
                                                                }
                                                                onDelete={
                                                                    deleteComment
                                                                }
                                                                onEdit={
                                                                    editComment
                                                                }
                                                            />
                                                        </ActivityDisplay>
                                                    </div>
                                                ),
                                            )}
                                            {isEditor() && (
                                                <>
                                                    <H1
                                                        data-testid="unscheduled"
                                                        className={css({
                                                            paddingLeft: {
                                                                base: "12px",
                                                                sm: "16px",
                                                            },
                                                            paddingTop: {
                                                                base: "16px",
                                                                sm: "32px",
                                                            },
                                                        })}
                                                    >
                                                        Unscheduled Activities
                                                    </H1>
                                                    {!unscheduledActivities.length && (
                                                        <>
                                                            <p
                                                                data-testid="empty-unscheduled"
                                                                className={css({
                                                                    paddingLeft:
                                                                        {
                                                                            base: "12px",
                                                                            sm: "16px",
                                                                        },
                                                                })}
                                                            >
                                                                There are no
                                                                unscheduled
                                                                activities
                                                            </p>
                                                        </>
                                                    )}
                                                    {unscheduledActivities.map(
                                                        (activity, index) => (
                                                            <div
                                                                key={
                                                                    activity.id
                                                                }
                                                            >
                                                                <ActivityDisplay
                                                                    activity={
                                                                        activity
                                                                    }
                                                                    onDelete={
                                                                        deleteActivity
                                                                    }
                                                                    onSchedule={(
                                                                        id,
                                                                    ) =>
                                                                        moveActivity(
                                                                            id,
                                                                            "schedule",
                                                                            scheduledActivities.length ||
                                                                                0,
                                                                        )
                                                                    }
                                                                    onEdit={
                                                                        editActivity
                                                                    }
                                                                    onMoveUp={
                                                                        index !==
                                                                        0
                                                                            ? (
                                                                                  id,
                                                                              ) =>
                                                                                  moveActivity(
                                                                                      id,
                                                                                      "unschedule",
                                                                                      activity.sortIndex -
                                                                                          1,
                                                                                  )
                                                                            : undefined
                                                                    }
                                                                    onMoveTop={
                                                                        index !==
                                                                        0
                                                                            ? (
                                                                                  id,
                                                                              ) =>
                                                                                  moveActivity(
                                                                                      id,
                                                                                      "unschedule",
                                                                                      0,
                                                                                  )
                                                                            : undefined
                                                                    }
                                                                    onMoveDown={
                                                                        index !==
                                                                        unscheduledActivities.length -
                                                                            1
                                                                            ? (
                                                                                  id,
                                                                              ) =>
                                                                                  moveActivity(
                                                                                      id,
                                                                                      "unschedule",
                                                                                      activity.sortIndex +
                                                                                          2,
                                                                                  )
                                                                            : undefined
                                                                    }
                                                                    onMoveBottom={
                                                                        index !==
                                                                        unscheduledActivities.length -
                                                                            1
                                                                            ? (
                                                                                  id,
                                                                              ) =>
                                                                                  moveActivity(
                                                                                      id,
                                                                                      "unschedule",
                                                                                      unscheduledActivities.length,
                                                                                  )
                                                                            : undefined
                                                                    }
                                                                >
                                                                    <Comments
                                                                        activity={
                                                                            activity
                                                                        }
                                                                        comments={
                                                                            commentsByActivityId[
                                                                                activity
                                                                                    .id
                                                                            ]
                                                                        }
                                                                        onCreate={(
                                                                            message,
                                                                        ) =>
                                                                            createComment(
                                                                                {
                                                                                    message,
                                                                                    activityId:
                                                                                        activity.id,
                                                                                },
                                                                            )
                                                                        }
                                                                        onDelete={
                                                                            deleteComment
                                                                        }
                                                                        onEdit={
                                                                            editComment
                                                                        }
                                                                    />
                                                                </ActivityDisplay>
                                                            </div>
                                                        ),
                                                    )}
                                                </>
                                            )}{" "}
                                            <ActivityForm
                                                eventId={event.id}
                                                onSubmit={createActivity}
                                            />{" "}
                                            {isEditor() && hasUndo && (
                                                <UndoButton
                                                    onUndo={undoLastMove}
                                                    data-testid="undo-button"
                                                />
                                            )}
                                        </div>
                                    </PaneProvider>
                                </Suspense>
                            )}
                        </CommentsContainer>
                    )}
                </ActivitiesContainer>
            </MusicLibraryContainer>
        </ChangePollingContainer>
    );
};

export default EventPageContainer;
