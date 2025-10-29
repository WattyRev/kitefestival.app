import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import setInterval from "../../util/setInterval";
import { useAuth } from "../global/Auth";
import { useAlert } from "../ui/Alert";
import { useChangePolling } from "../ChangePollingContainer";
import ActivitiesContainer from "../ActivitiesContainer";
import {
    createActivity,
    deleteActivity,
    editActivities,
    editActivity,
    getActivities,
} from "../../app/api/activities";

jest.mock("../../util/setInterval");
jest.mock("../../util/clearInterval");
jest.mock("../global/Auth");
jest.mock("../ui/Alert");
jest.mock("../ChangePollingContainer");
jest.mock("../../app/api/activities");

describe("ActivitiesContainer", () => {
    let initialActivities;
    let mockOpenAlert;
    beforeEach(() => {
        useChangePolling.mockReturnValue({
            changes: [],
        });
        createActivity.mockResolvedValue({});
        deleteActivity.mockResolvedValue({});
        editActivities.mockResolvedValue({});
        editActivity.mockResolvedValue({});
        getActivities.mockResolvedValue({});

        setInterval.mockReturnValue(1);
        initialActivities = [
            {
                id: "1",
                name: "Activity 1",
                description: "Description 1",
                sortIndex: null,
                scheduleIndex: 0,
            },
            {
                id: "2",
                name: "Activity 2",
                description: "Description 2",
                sortIndex: null,
                scheduleIndex: 1,
            },
            {
                id: "3",
                name: "Activity 3",
                description: "Description 3",
                sortIndex: 0,
                scheduleIndex: null,
            },
            {
                id: "4",
                name: "Activity 4",
                description: "Description 4",
                sortIndex: 1,
                scheduleIndex: null,
            },
        ];
        useAuth.mockReturnValue({
            auth: {
                passcode: "boogers-passcode",
            },
        });
        mockOpenAlert = jest.fn();
        useAlert.mockReturnValue({
            openAlert: mockOpenAlert,
        });
    });
    it("provides activities", async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ activities }) => (
                    <>
                        {activities.map((activity) => (
                            <div data-testid="activity" key={activity.id}>
                                {activity.name}
                            </div>
                        ))}
                    </>
                )}
            </ActivitiesContainer>,
        );

        expect(screen.queryAllByTestId("activity")).toHaveLength(4);
    });
    it("provides scheduledActivities", async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ scheduledActivities }) => (
                    <>
                        {scheduledActivities.map((activity) => (
                            <div data-testid="activity" key={activity.id}>
                                {activity.name}
                            </div>
                        ))}
                    </>
                )}
            </ActivitiesContainer>,
        );

        expect(screen.queryAllByTestId("activity")).toHaveLength(2);
        expect(screen.getAllByTestId("activity")[0]).toHaveTextContent(
            "Activity 1",
        );
    });
    it("provides unscheduledActivities", async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ unscheduledActivities }) => (
                    <>
                        {unscheduledActivities.map((activity) => (
                            <div data-testid="activity" key={activity.id}>
                                {activity.name}
                            </div>
                        ))}
                    </>
                )}
            </ActivitiesContainer>,
        );

        expect(screen.queryAllByTestId("activity")).toHaveLength(2);
        expect(screen.queryAllByTestId("activity")[0]).toHaveTextContent(
            "Activity 3",
        );
    });
    it("indicates when it is loading new activity data", async () => {
        useChangePolling.mockReturnValue({
            changes: [
                {
                    tablename: "activities",
                    updated: new Date().toISOString(),
                },
            ],
        });
        let activitiesResolver;
        getActivities.mockImplementation(() => {
            return new Promise((resolve) => {
                activitiesResolver = () =>
                    resolve({
                        activities: initialActivities,
                    });
            });
        });

        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ isLoading }) => (
                    <>
                        {
                            <div data-testid="loading">
                                {isLoading ? "loading" : "not loading"}
                            </div>
                        }
                    </>
                )}
            </ActivitiesContainer>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("loading")).toHaveTextContent("loading"),
        );

        activitiesResolver();

        await waitFor(() =>
            expect(screen.getByTestId("loading")).toHaveTextContent(
                "not loading",
            ),
        );
    });
    describe("activity creation", () => {
        it("allows a user to create an activity", async () => {
            createActivity.mockResolvedValue({
                id: "5",
                name: "title",
                description: "description",
                sortIndex: 1,
                scheduleIndex: null,
            });
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ createActivity, activities }) => (
                        <>
                            {activities.map((activity) => (
                                <div data-testid="activity" key={activity.id}>
                                    {activity.name}
                                </div>
                            ))}
                            <button
                                data-testid="create-activity"
                                onClick={() =>
                                    createActivity({
                                        title: "Activity 5",
                                        description: "Description 5",
                                        music: ["song1", "song2"],
                                    })
                                }
                            >
                                Create Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            expect(screen.queryAllByTestId("activity")).toHaveLength(4);

            await userEvent.click(screen.getByTestId("create-activity"));

            expect(createActivity).toHaveBeenCalledWith({
                title: "Activity 5",
                description: "Description 5",
                music: ["song1", "song2"],
            });

            expect(screen.queryAllByTestId("activity")).toHaveLength(5);
        });
        it("alerts if activity creation fails", async () => {
            createActivity.mockRejectedValue();
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ createActivity }) => (
                        <>
                            <button
                                data-testid="create-activity"
                                onClick={() =>
                                    createActivity({
                                        title: "Activity 5",
                                        description: "Description 5",
                                    })
                                }
                            >
                                Create Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            await userEvent.click(screen.getByTestId("create-activity"));

            expect(mockOpenAlert).toHaveBeenCalledWith(
                "Failed to create activity",
                "error",
            );
        });
    });
    describe("activity deletion", () => {
        it("allows a user to delete an activity", async () => {
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ deleteActivity, activities }) => (
                        <>
                            {activities.map((activity) => (
                                <div data-testid="activity" key={activity.id}>
                                    {activity.name}
                                </div>
                            ))}
                            <button
                                data-testid="delete-activity"
                                onClick={() => deleteActivity("2")}
                            >
                                Delete Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            expect(screen.queryAllByTestId("activity")).toHaveLength(4);

            await userEvent.click(screen.getByTestId("delete-activity"));

            expect(deleteActivity).toHaveBeenCalledWith("2");

            expect(screen.queryAllByTestId("activity")).toHaveLength(3);
        });
        it("alerts if activity deletion fails", async () => {
            deleteActivity.mockRejectedValue();
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ deleteActivity }) => (
                        <>
                            <button
                                data-testid="delete-activity"
                                onClick={() => deleteActivity("2")}
                            >
                                Delete Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            await userEvent.click(screen.getByTestId("delete-activity"));

            expect(mockOpenAlert).toHaveBeenCalledWith(
                "Failed to delete activity",
                "error",
            );
        });
    });
    describe("activity editing", () => {
        it("allows a user to edit an activity", async () => {
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ editActivity, activities }) => (
                        <>
                            {activities.map((activity) => (
                                <div data-testid="activity" key={activity.id}>
                                    {activity.name}
                                </div>
                            ))}
                            <button
                                data-testid="edit-activity"
                                onClick={() =>
                                    editActivity({
                                        id: "2",
                                        title: "edited",
                                        description: "also edited",
                                    })
                                }
                            >
                                Edit Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            await userEvent.click(screen.getByTestId("edit-activity"));

            expect(editActivity).toHaveBeenCalledWith("2", {
                id: "2",
                title: "edited",
                description: "also edited",
            });
        });
        it("alerts if activity deletion fails", async () => {
            editActivity.mockRejectedValue();
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ editActivity }) => (
                        <>
                            <button
                                data-testid="edit-activity"
                                onClick={() =>
                                    editActivity({
                                        id: "2",
                                        title: "edited",
                                        description: "also edited",
                                    })
                                }
                            >
                                Edit Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            await userEvent.click(screen.getByTestId("edit-activity"));

            expect(mockOpenAlert).toHaveBeenCalledWith(
                "Failed to edit activity",
                "error",
            );
        });
    });
    describe("scheduling an activity", () => {
        it("allows a user to schedule an activity", async () => {
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({
                        moveActivity,
                        scheduledActivities,
                        unscheduledActivities,
                    }) => (
                        <>
                            {scheduledActivities.map((activity) => (
                                <div data-testid="scheduled" key={activity.id}>
                                    {activity.name}
                                </div>
                            ))}
                            {unscheduledActivities.map((activity) => (
                                <div
                                    data-testid="unscheduled"
                                    key={activity.id}
                                >
                                    {activity.name}
                                </div>
                            ))}
                            <button
                                data-testid="schedule-activity"
                                onClick={() => moveActivity("3", "schedule", 3)}
                            >
                                Schedule Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            expect(screen.queryAllByTestId("scheduled")).toHaveLength(2);
            expect(screen.queryAllByTestId("unscheduled")).toHaveLength(2);

            await userEvent.click(screen.getByTestId("schedule-activity"));

            expect(editActivities).toHaveBeenCalledWith([
                {
                    id: "3",
                    name: "Activity 3",
                    description: "Description 3",
                    sortIndex: null,
                    scheduleIndex: 2,
                },
                {
                    id: "4",
                    name: "Activity 4",
                    description: "Description 4",
                    sortIndex: 0,
                    scheduleIndex: null,
                },
            ]);

            expect(screen.queryAllByTestId("scheduled")).toHaveLength(3);
            expect(screen.queryAllByTestId("scheduled")[2]).toHaveTextContent(
                "Activity 3",
            );
            expect(screen.queryAllByTestId("unscheduled")).toHaveLength(1);
        });
        it("alerts if activity scheduling fails", async () => {
            editActivities.mockRejectedValue();
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ moveActivity }) => (
                        <>
                            <button
                                data-testid="schedule-activity"
                                onClick={() => moveActivity("2", "schedule", 3)}
                            >
                                Schedule Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            await userEvent.click(screen.getByTestId("schedule-activity"));

            expect(mockOpenAlert).toHaveBeenCalledWith(
                "Failed to move activities",
                "error",
            );
        });
    });
    describe("unscheduling an activity", () => {
        it("allows a user to unschedule an activity", async () => {
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({
                        moveActivity,
                        scheduledActivities,
                        unscheduledActivities,
                    }) => (
                        <>
                            {scheduledActivities.map((activity) => (
                                <div data-testid="scheduled" key={activity.id}>
                                    {activity.name}
                                </div>
                            ))}
                            {unscheduledActivities.map((activity) => (
                                <div
                                    data-testid="unscheduled"
                                    key={activity.id}
                                >
                                    {activity.name}
                                </div>
                            ))}
                            <button
                                data-testid="unschedule-activity"
                                onClick={() =>
                                    moveActivity("1", "unschedule", 0)
                                }
                            >
                                Unschedule Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            expect(screen.queryAllByTestId("scheduled")).toHaveLength(2);
            expect(screen.queryAllByTestId("unscheduled")).toHaveLength(2);

            await userEvent.click(screen.getByTestId("unschedule-activity"));

            expect(editActivities).toHaveBeenCalledWith([
                {
                    id: "2",
                    name: "Activity 2",
                    description: "Description 2",
                    sortIndex: null,
                    scheduleIndex: 0,
                },
                {
                    id: "1",
                    name: "Activity 1",
                    description: "Description 1",
                    sortIndex: 0,
                    scheduleIndex: null,
                },
                {
                    id: "3",
                    name: "Activity 3",
                    description: "Description 3",
                    sortIndex: 1,
                    scheduleIndex: null,
                },
                {
                    id: "4",
                    name: "Activity 4",
                    description: "Description 4",
                    sortIndex: 2,
                    scheduleIndex: null,
                },
            ]);

            expect(screen.queryAllByTestId("scheduled")).toHaveLength(1);
            expect(screen.queryAllByTestId("unscheduled")).toHaveLength(3);
            expect(screen.queryAllByTestId("unscheduled")[0]).toHaveTextContent(
                "Activity 1",
            );
        });
        it("alerts if activity unscheduling fails", async () => {
            editActivities.mockRejectedValue();
            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ moveActivity }) => (
                        <>
                            <button
                                data-testid="unschedule-activity"
                                onClick={() =>
                                    moveActivity("1", "unschedule", 0)
                                }
                            >
                                Unschedule Activity
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            await userEvent.click(screen.getByTestId("unschedule-activity"));

            expect(mockOpenAlert).toHaveBeenCalledWith(
                "Failed to move activities",
                "error",
            );
        });
    });
    describe("moving a scheduled activity", () => {
        it("allows the user to move a scheduled activity up", async () => {
            initialActivities = [
                {
                    id: "1",
                    name: "Activity 1",
                    description: "Description 1",
                    sortIndex: null,
                    scheduleIndex: 0,
                },
                {
                    id: "2",
                    name: "Activity 2",
                    description: "Description 2",
                    sortIndex: null,
                    scheduleIndex: 1,
                },
                {
                    id: "3",
                    name: "Activity 3",
                    description: "Description 3",
                    sortIndex: null,
                    scheduleIndex: 2,
                },
                {
                    id: "4",
                    name: "Activity 4",
                    description: "Description 4",
                    sortIndex: 3,
                    scheduleIndex: null,
                },
            ];

            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ scheduledActivities, moveActivity }) => (
                        <>
                            {scheduledActivities.map((activity) => (
                                <div data-testid="activity" key={activity.id}>
                                    {activity.name}
                                </div>
                            ))}
                            <button
                                data-testid="move-activity-up"
                                onClick={() => moveActivity("3", "schedule", 1)}
                            >
                                Move Activity Up
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            let activities = screen.queryAllByTestId("activity");
            expect(activities).toHaveLength(3);
            expect(activities[0]).toHaveTextContent("Activity 1");
            expect(activities[1]).toHaveTextContent("Activity 2");
            expect(activities[2]).toHaveTextContent("Activity 3");

            await userEvent.click(screen.getByTestId("move-activity-up"));

            activities = screen.queryAllByTestId("activity");
            expect(activities[0]).toHaveTextContent("Activity 1");
            expect(activities[1]).toHaveTextContent("Activity 3");
            expect(activities[2]).toHaveTextContent("Activity 2");
        });
        it("allows the user to move a scheduled activity down", async () => {
            initialActivities = [
                {
                    id: "1",
                    name: "Activity 1",
                    description: "Description 1",
                    sortIndex: null,
                    scheduleIndex: 0,
                },
                {
                    id: "2",
                    name: "Activity 2",
                    description: "Description 2",
                    sortIndex: null,
                    scheduleIndex: 1,
                },
                {
                    id: "3",
                    name: "Activity 3",
                    description: "Description 3",
                    sortIndex: null,
                    scheduleIndex: 2,
                },
                {
                    id: "4",
                    name: "Activity 4",
                    description: "Description 4",
                    sortIndex: 3,
                    scheduleIndex: null,
                },
            ];

            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ scheduledActivities, moveActivity }) => (
                        <>
                            {scheduledActivities.map((activity) => (
                                <div data-testid="activity" key={activity.id}>
                                    {activity.name}
                                </div>
                            ))}
                            <button
                                data-testid="move-activity-down"
                                onClick={() => moveActivity("1", "schedule", 2)}
                            >
                                Move Activity Down
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            let activities = screen.queryAllByTestId("activity");
            expect(activities).toHaveLength(3);
            expect(activities[0]).toHaveTextContent("Activity 1");
            expect(activities[1]).toHaveTextContent("Activity 2");
            expect(activities[2]).toHaveTextContent("Activity 3");

            await userEvent.click(screen.getByTestId("move-activity-down"));

            activities = screen.queryAllByTestId("activity");
            expect(activities[0]).toHaveTextContent("Activity 2");
            expect(activities[1]).toHaveTextContent("Activity 1");
            expect(activities[2]).toHaveTextContent("Activity 3");
        });
    });
    describe("moving an unscheduled activity", () => {
        it("allows the user to move an unscheduled activity up", async () => {
            initialActivities = [
                {
                    id: "1",
                    name: "Activity 1",
                    description: "Description 1",
                    sortIndex: null,
                    scheduleIndex: 0,
                },
                {
                    id: "2",
                    name: "Activity 2",
                    description: "Description 2",
                    sortIndex: 1,
                    scheduleIndex: null,
                },
                {
                    id: "3",
                    name: "Activity 3",
                    description: "Description 3",
                    sortIndex: 2,
                    scheduleIndex: null,
                },
                {
                    id: "4",
                    name: "Activity 4",
                    description: "Description 4",
                    sortIndex: 3,
                    scheduleIndex: null,
                },
            ];

            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ unscheduledActivities, moveActivity }) => (
                        <>
                            {unscheduledActivities.map((activity) => (
                                <div data-testid="activity" key={activity.id}>
                                    {activity.name}
                                </div>
                            ))}
                            <button
                                data-testid="move-activity-up"
                                onClick={() =>
                                    moveActivity("4", "unschedule", 2)
                                }
                            >
                                Move Activity Up
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            let activities = screen.queryAllByTestId("activity");
            expect(activities).toHaveLength(3);
            expect(activities[0]).toHaveTextContent("Activity 2");
            expect(activities[1]).toHaveTextContent("Activity 3");
            expect(activities[2]).toHaveTextContent("Activity 4");

            await userEvent.click(screen.getByTestId("move-activity-up"));

            activities = screen.queryAllByTestId("activity");
            expect(activities[0]).toHaveTextContent("Activity 2");
            expect(activities[1]).toHaveTextContent("Activity 4");
            expect(activities[2]).toHaveTextContent("Activity 3");
        });
        it("allows the user to move an unscheduled activity down", async () => {
            initialActivities = [
                {
                    id: "1",
                    name: "Activity 1",
                    description: "Description 1",
                    sortIndex: null,
                    scheduleIndex: 0,
                },
                {
                    id: "2",
                    name: "Activity 2",
                    description: "Description 2",
                    sortIndex: 1,
                    scheduleIndex: null,
                },
                {
                    id: "3",
                    name: "Activity 3",
                    description: "Description 3",
                    sortIndex: 2,
                    scheduleIndex: null,
                },
                {
                    id: "4",
                    name: "Activity 4",
                    description: "Description 4",
                    sortIndex: 3,
                    scheduleIndex: null,
                },
            ];

            render(
                <ActivitiesContainer initialActivities={initialActivities}>
                    {({ unscheduledActivities, moveActivity }) => (
                        <>
                            {unscheduledActivities.map((activity) => (
                                <div data-testid="activity" key={activity.id}>
                                    {activity.name}
                                </div>
                            ))}
                            <button
                                data-testid="move-activity-down"
                                onClick={() =>
                                    moveActivity("2", "unschedule", 3)
                                }
                            >
                                Move Activity Down
                            </button>
                        </>
                    )}
                </ActivitiesContainer>,
            );

            let activities = screen.queryAllByTestId("activity");
            expect(activities).toHaveLength(3);
            expect(activities[0]).toHaveTextContent("Activity 2");
            expect(activities[1]).toHaveTextContent("Activity 3");
            expect(activities[2]).toHaveTextContent("Activity 4");

            await userEvent.click(screen.getByTestId("move-activity-down"));

            activities = screen.queryAllByTestId("activity");
            expect(activities[0]).toHaveTextContent("Activity 3");
            expect(activities[1]).toHaveTextContent("Activity 2");
            expect(activities[2]).toHaveTextContent("Activity 4");
        });
    });

    describe("undo functionality", () => {
        let undoTestActivities;

        beforeEach(() => {
            undoTestActivities = [
                {
                    id: "1",
                    title: "Activity 1",
                    description: "Description 1",
                    sortIndex: 0,
                    scheduleIndex: null,
                },
                {
                    id: "2",
                    title: "Activity 2",
                    description: "Description 2",
                    sortIndex: 1,
                    scheduleIndex: null,
                },
                {
                    id: "3",
                    title: "Activity 3",
                    description: "Description 3",
                    sortIndex: null,
                    scheduleIndex: 0,
                },
            ];
        });

        it("initially does not have undo available", async () => {
            render(
                <ActivitiesContainer initialActivities={undoTestActivities}>
                    {({ hasUndo }) => (
                        <div data-testid="has-undo">
                            {hasUndo ? "yes" : "no"}
                        </div>
                    )}
                </ActivitiesContainer>,
            );

            expect(screen.getByTestId("has-undo")).toHaveTextContent("no");
        });

        it("has undo available after moving an activity", async () => {
            render(
                <ActivitiesContainer initialActivities={undoTestActivities}>
                    {({ hasUndo, moveActivity }) => (
                        <div>
                            <div data-testid="has-undo">
                                {hasUndo ? "yes" : "no"}
                            </div>
                            <button
                                data-testid="move-activity"
                                onClick={() => moveActivity("1", "schedule", 1)}
                            >
                                Move Activity
                            </button>
                        </div>
                    )}
                </ActivitiesContainer>,
            );

            expect(screen.getByTestId("has-undo")).toHaveTextContent("no");

            await userEvent.click(screen.getByTestId("move-activity"));

            await waitFor(() => {
                expect(screen.getByTestId("has-undo")).toHaveTextContent("yes");
            });
        });

        it("can undo a move operation", async () => {
            render(
                <ActivitiesContainer initialActivities={undoTestActivities}>
                    {({
                        hasUndo,
                        moveActivity,
                        undoLastMove,
                        unscheduledActivities,
                        scheduledActivities,
                    }) => (
                        <div>
                            <div data-testid="has-undo">
                                {hasUndo ? "yes" : "no"}
                            </div>
                            <div data-testid="unscheduled-count">
                                {unscheduledActivities.length}
                            </div>
                            <div data-testid="scheduled-count">
                                {scheduledActivities.length}
                            </div>
                            <button
                                data-testid="move-activity"
                                onClick={() => moveActivity("1", "schedule", 1)}
                            >
                                Move Activity
                            </button>
                            <button
                                data-testid="undo-move"
                                onClick={undoLastMove}
                            >
                                Undo Move
                            </button>
                        </div>
                    )}
                </ActivitiesContainer>,
            );

            // Initial state: 2 unscheduled, 1 scheduled
            expect(screen.getByTestId("unscheduled-count")).toHaveTextContent(
                "2",
            );
            expect(screen.getByTestId("scheduled-count")).toHaveTextContent(
                "1",
            );

            // Move activity from unscheduled to scheduled
            await userEvent.click(screen.getByTestId("move-activity"));

            await waitFor(() => {
                expect(
                    screen.getByTestId("unscheduled-count"),
                ).toHaveTextContent("1");
                expect(screen.getByTestId("scheduled-count")).toHaveTextContent(
                    "2",
                );
                expect(screen.getByTestId("has-undo")).toHaveTextContent("yes");
            });

            // Undo the move
            await userEvent.click(screen.getByTestId("undo-move"));

            await waitFor(() => {
                expect(
                    screen.getByTestId("unscheduled-count"),
                ).toHaveTextContent("2");
                expect(screen.getByTestId("scheduled-count")).toHaveTextContent(
                    "1",
                );
                expect(screen.getByTestId("has-undo")).toHaveTextContent("no");
            });
        });

        it("clears undo when creating a new activity", async () => {
            render(
                <ActivitiesContainer initialActivities={undoTestActivities}>
                    {({ hasUndo, moveActivity, createActivity }) => (
                        <div>
                            <div data-testid="has-undo">
                                {hasUndo ? "yes" : "no"}
                            </div>
                            <button
                                data-testid="move-activity"
                                onClick={() => moveActivity("1", "schedule", 1)}
                            >
                                Move Activity
                            </button>
                            <button
                                data-testid="create-activity"
                                onClick={() =>
                                    createActivity({
                                        title: "New Activity",
                                        description: "New Description",
                                    })
                                }
                            >
                                Create Activity
                            </button>
                        </div>
                    )}
                </ActivitiesContainer>,
            );

            // Move activity to enable undo
            await userEvent.click(screen.getByTestId("move-activity"));

            await waitFor(() => {
                expect(screen.getByTestId("has-undo")).toHaveTextContent("yes");
            });

            // Create activity should clear undo
            createActivity.mockResolvedValue({
                activity: {
                    id: "4",
                    title: "New Activity",
                    description: "New Description",
                    sortIndex: 2,
                    scheduleIndex: null,
                },
            });

            await userEvent.click(screen.getByTestId("create-activity"));

            await waitFor(() => {
                expect(screen.getByTestId("has-undo")).toHaveTextContent("no");
            });
        });

        it("handles undo failure gracefully", async () => {
            render(
                <ActivitiesContainer initialActivities={undoTestActivities}>
                    {({ hasUndo, moveActivity, undoLastMove }) => (
                        <div>
                            <div data-testid="has-undo">
                                {hasUndo ? "yes" : "no"}
                            </div>
                            <button
                                data-testid="move-activity"
                                onClick={() => moveActivity("1", "schedule", 1)}
                            >
                                Move Activity
                            </button>
                            <button
                                data-testid="undo-move"
                                onClick={undoLastMove}
                            >
                                Undo Move
                            </button>
                        </div>
                    )}
                </ActivitiesContainer>,
            );

            // Move activity to enable undo
            await userEvent.click(screen.getByTestId("move-activity"));

            await waitFor(() => {
                expect(screen.getByTestId("has-undo")).toHaveTextContent("yes");
            });

            // Mock failure response for undo
            editActivities.mockRejectedValue();

            await userEvent.click(screen.getByTestId("undo-move"));

            await waitFor(() => {
                expect(mockOpenAlert).toHaveBeenCalledWith(
                    "Failed to undo move",
                    "error",
                );
            });
        });

        it("supports single undo operation", async () => {
            render(
                <ActivitiesContainer initialActivities={undoTestActivities}>
                    {({
                        hasUndo,
                        moveActivity,
                        undoLastMove,
                        unscheduledActivities,
                        scheduledActivities,
                    }) => (
                        <div>
                            <div data-testid="has-undo">
                                {hasUndo ? "yes" : "no"}
                            </div>
                            <div data-testid="unscheduled-count">
                                {unscheduledActivities.length}
                            </div>
                            <div data-testid="scheduled-count">
                                {scheduledActivities.length}
                            </div>
                            <button
                                data-testid="move-activity-1"
                                onClick={() => moveActivity("1", "schedule", 1)}
                            >
                                Move Activity 1
                            </button>
                            <button
                                data-testid="move-activity-2"
                                onClick={() => moveActivity("2", "schedule", 1)}
                            >
                                Move Activity 2
                            </button>
                            <button
                                data-testid="undo-move"
                                onClick={undoLastMove}
                            >
                                Undo Move
                            </button>
                        </div>
                    )}
                </ActivitiesContainer>,
            );

            // Initial state: 2 unscheduled, 1 scheduled
            expect(screen.getByTestId("unscheduled-count")).toHaveTextContent(
                "2",
            );
            expect(screen.getByTestId("scheduled-count")).toHaveTextContent(
                "1",
            );

            // First move: Activity 1 from unscheduled to scheduled
            await userEvent.click(screen.getByTestId("move-activity-1"));

            await waitFor(() => {
                expect(
                    screen.getByTestId("unscheduled-count"),
                ).toHaveTextContent("1");
                expect(screen.getByTestId("scheduled-count")).toHaveTextContent(
                    "2",
                );
            });

            // Second move: Activity 2 from unscheduled to scheduled (replaces previous undo)
            await userEvent.click(screen.getByTestId("move-activity-2"));

            await waitFor(() => {
                expect(
                    screen.getByTestId("unscheduled-count"),
                ).toHaveTextContent("0");
                expect(screen.getByTestId("scheduled-count")).toHaveTextContent(
                    "3",
                );
            });

            // Undo: Should restore only the last move (Activity 2 back to unscheduled)
            await userEvent.click(screen.getByTestId("undo-move"));

            await waitFor(() => {
                expect(
                    screen.getByTestId("unscheduled-count"),
                ).toHaveTextContent("1");
                expect(screen.getByTestId("scheduled-count")).toHaveTextContent(
                    "2",
                );
                expect(screen.getByTestId("has-undo")).toHaveTextContent("no");
            });
        });

        it("maintains only a single undo state", async () => {
            render(
                <ActivitiesContainer initialActivities={undoTestActivities}>
                    {({ hasUndo, moveActivity }) => (
                        <div>
                            <div data-testid="has-undo">
                                {hasUndo ? "yes" : "no"}
                            </div>
                            <button
                                data-testid="move-activity-1"
                                onClick={() => moveActivity("1", "schedule", 1)}
                            >
                                Move Activity 1
                            </button>
                            <button
                                data-testid="move-activity-2"
                                onClick={() => moveActivity("2", "schedule", 1)}
                            >
                                Move Activity 2
                            </button>
                            <button
                                data-testid="move-activity-3"
                                onClick={() =>
                                    moveActivity("3", "unschedule", 1)
                                }
                            >
                                Move Activity 3
                            </button>
                            <button
                                data-testid="move-activity-1-again"
                                onClick={() =>
                                    moveActivity("1", "unschedule", 1)
                                }
                            >
                                Move Activity 1 Again
                            </button>
                        </div>
                    )}
                </ActivitiesContainer>,
            );

            // Make 4 moves
            await userEvent.click(screen.getByTestId("move-activity-1"));
            await waitFor(() =>
                expect(screen.getByTestId("has-undo")).toHaveTextContent("yes"),
            );

            await userEvent.click(screen.getByTestId("move-activity-2"));
            await waitFor(() =>
                expect(screen.getByTestId("has-undo")).toHaveTextContent("yes"),
            );

            await userEvent.click(screen.getByTestId("move-activity-3"));
            await waitFor(() =>
                expect(screen.getByTestId("has-undo")).toHaveTextContent("yes"),
            );

            await userEvent.click(screen.getByTestId("move-activity-1-again"));
            await waitFor(() => {
                // Should still have undo available, as each new move replaces the previous undo
                expect(screen.getByTestId("has-undo")).toHaveTextContent("yes");
            });
        });
    });
});
