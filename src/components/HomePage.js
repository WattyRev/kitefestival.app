"use client";
import { Suspense, useState } from "react";
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
import {
    closestCenter,
    DndContext,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import ActivityDrop from "./ActivityDrop";
import ActivityDropZone from "./ActivityDropZone";
import {
    restrictToVerticalAxis,
    restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import UndoButton from "./ui/UndoButton";

const HomePageContainer = ({ activities: initialActivities }) => {
    const { isEditor } = useAuth();
    const [activelyDraggedId, setActivelyDraggedId] = useState(null);
    const activationConstraint = { delay: 250, tolerance: 5 };
    const sensors = useSensors(
        useSensor(TouchSensor, { activationConstraint }),
        useSensor(MouseSensor, { activationConstraint }),
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
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragStart={(event) => {
                                                if (!isEditor()) {
                                                    return;
                                                }
                                                setActivelyDraggedId(
                                                    event.active.id,
                                                );
                                            }}
                                            onDragEnd={(event) => {
                                                if (!isEditor()) {
                                                    return;
                                                }
                                                setActivelyDraggedId(null);
                                                const { active, over } = event;
                                                const activityId = active.id;
                                                const { bucket, index } =
                                                    over.data.current;
                                                moveActivity(
                                                    activityId,
                                                    bucket,
                                                    index,
                                                );
                                            }}
                                            modifiers={[
                                                restrictToVerticalAxis,
                                                restrictToWindowEdges,
                                            ]}
                                        >
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
                                                    {isEditor() &&
                                                        !!activities.length && (
                                                            <ActivityDropZone
                                                                bucket="schedule"
                                                                index={0}
                                                                id="schedule-empty"
                                                                text="Drag activities here to schedule them"
                                                            />
                                                        )}
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
                                                        {isEditor() &&
                                                            activelyDraggedId !==
                                                                scheduledActivities[
                                                                    index - 1
                                                                ]?.id && (
                                                                <ActivityDrop
                                                                    bucket="schedule"
                                                                    index={
                                                                        activity.scheduleIndex
                                                                    }
                                                                    id={`schedule-${activity.id}-top`}
                                                                />
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
                                                            isGlobalDragging={
                                                                !!activelyDraggedId
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
                                                        {index ===
                                                            scheduledActivities.length -
                                                                1 &&
                                                            activity.id !==
                                                                activelyDraggedId &&
                                                            isEditor() && (
                                                                <ActivityDrop
                                                                    bucket="schedule"
                                                                    index={
                                                                        activity.scheduleIndex +
                                                                        1
                                                                    }
                                                                    id={`schedule-${activity.id}-bottom`}
                                                                />
                                                            )}
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
                                                            {isEditor() &&
                                                                !!activities.length && (
                                                                    <ActivityDropZone
                                                                        bucket="unschedule"
                                                                        index={
                                                                            0
                                                                        }
                                                                        id={
                                                                            "unschedule-empty"
                                                                        }
                                                                        text="Drag activities here to unschedule them"
                                                                    />
                                                                )}
                                                        </>
                                                    )}
                                                    {unscheduledActivities.map(
                                                        (activity, index) => (
                                                            <div
                                                                key={
                                                                    activity.id
                                                                }
                                                            >
                                                                {isEditor() &&
                                                                    activelyDraggedId !==
                                                                        unscheduledActivities[
                                                                            index -
                                                                                1
                                                                        ]
                                                                            ?.id && (
                                                                        <ActivityDrop
                                                                            bucket="unschedule"
                                                                            index={
                                                                                activity.sortIndex
                                                                            }
                                                                            id={`unschedule-${activity.id}-top`}
                                                                        />
                                                                    )}
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
                                                                {index ===
                                                                    unscheduledActivities.length -
                                                                        1 &&
                                                                    isEditor() &&
                                                                    activelyDraggedId !==
                                                                        activity.id && (
                                                                        <ActivityDrop
                                                                            bucket="unschedule"
                                                                            index={
                                                                                activity.sortIndex +
                                                                                1
                                                                            }
                                                                            id={`unschedule-${activity.id}-bottom`}
                                                                        />
                                                                    )}
                                                            </div>
                                                        ),
                                                    )}
                                                </>
                                            )}{" "}
                                        </DndContext>
                                        <ActivityForm
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
        </ChangePollingContainer>
    );
};

export default HomePageContainer;
