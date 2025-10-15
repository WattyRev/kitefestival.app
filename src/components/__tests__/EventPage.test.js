import { render, screen } from "@testing-library/react";
import ActivitiesContainer from "../ActivitiesContainer";
import ChangePollingContainer from "../ChangePollingContainer";
import CommentsContainer from "../CommentsContainer";
import ActivityDisplay from "../ActivityDisplay";
import Comments from "../Comments";
import ActivityForm from "../ActivityForm";
import { useAuth } from "../global/Auth";
import EventPage from "../EventPage";
import MusicLibraryContainer from "../MusicLibraryContainer";

jest.mock("../ActivitiesContainer");
jest.mock("../ChangePollingContainer");
jest.mock("../CommentsContainer");
jest.mock("../MusicLibraryContainer");
jest.mock("../ActivityDisplay");
jest.mock("../Comments");
jest.mock("../ActivityForm");
jest.mock("../global/Auth");

describe("EventPage", () => {
    beforeEach(() => {
        ChangePollingContainer.mockImplementation(({ children }) => (
            <>{children}</>
        ));
        ActivitiesContainer.mockImplementation(({ children }) => {
            // Handle the case where children is an array with a function (due to JSX whitespace)
            let renderFunction = null;
            if (typeof children === "function") {
                renderFunction = children;
            } else if (Array.isArray(children)) {
                // Find the function in the children array
                renderFunction = children.find(
                    (child) => typeof child === "function",
                );
            }

            if (renderFunction) {
                return renderFunction({
                    scheduledActivities: [],
                    unscheduledActivities: [],
                    activities: [],
                    isLoading: false,
                    createActivity: jest.fn(),
                    editActivity: jest.fn(),
                    deleteActivity: jest.fn(),
                    moveActivity: jest.fn(),
                    moveActivityUp: jest.fn(),
                    moveActivityDown: jest.fn(),
                    undoLastMove: jest.fn(),
                    hasUndo: false,
                    clearUndo: jest.fn(),
                });
            }
            return (
                <div data-testid="activities-container">
                    Mock ActivitiesContainer
                </div>
            );
        });
        MusicLibraryContainer.mockImplementation(({ children }) => (
            <div data-testid="music-library-container">{children}</div>
        ));
        CommentsContainer.mockImplementation(({ children }) => {
            // Handle the case where children is an array with a function (due to JSX whitespace)
            let renderFunction = null;
            if (typeof children === "function") {
                renderFunction = children;
            } else if (Array.isArray(children)) {
                // Find the function in the children array
                renderFunction = children.find(
                    (child) => typeof child === "function",
                );
            }

            if (renderFunction) {
                return renderFunction({
                    commentsByActivityId: {},
                    isLoading: false,
                    createComment: jest.fn(),
                    deleteComment: jest.fn(),
                    editComment: jest.fn(),
                });
            }
            return <div data-testid="comments-container">{children}</div>;
        });
        ActivityDisplay.mockImplementation(({ children }) => (
            <div data-testid="activity-display">{children}</div>
        ));
        Comments.mockReturnValue(<div data-testid="comments" />);
        ActivityForm.mockReturnValue(
            <div data-testid="create-activity-form" />,
        );
        useAuth.mockReturnValue({
            isPublic: jest.fn().mockReturnValue(false),
            isEditor: jest.fn().mockReturnValue(true),
        });
    });
    it("renders", async () => {
        render(<EventPage />);
        expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
    it("renders an empty state when there are no unscheduledActivities", async () => {
        render(<EventPage />);
        expect(screen.getByTestId("empty-unscheduled")).toBeInTheDocument();
        expect(
            screen.queryByTestId("activity-display"),
        ).not.toBeInTheDocument();
    });
    it("renders an ActivityDisplay for each unscheduledActivity", async () => {
        ActivitiesContainer.mockImplementation(({ children }) => {
            const scheduledActivities = [];
            const unscheduledActivities = [
                {
                    id: 1,
                    name: "Activity 1",
                    description: "Description 1",
                },
                {
                    id: 2,
                    name: "Activity 2",
                    description: "Description 2",
                },
            ];

            // Handle the case where children is an array with a function (due to JSX whitespace)
            let renderFunction = null;
            if (typeof children === "function") {
                renderFunction = children;
            } else if (Array.isArray(children)) {
                renderFunction = children.find(
                    (child) => typeof child === "function",
                );
            }

            if (renderFunction) {
                return renderFunction({
                    scheduledActivities,
                    unscheduledActivities,
                    activities: [
                        ...scheduledActivities,
                        ...unscheduledActivities,
                    ],
                    isLoading: false,
                    createActivity: jest.fn(),
                    deleteActivity: jest.fn(),
                    editActivity: jest.fn(),
                    moveActivity: jest.fn(),
                    moveActivityUp: jest.fn(),
                    moveActivityDown: jest.fn(),
                    undoLastMove: jest.fn(),
                    hasUndo: false,
                    clearUndo: jest.fn(),
                });
            }
            return <div data-testid="activities-container">{children}</div>;
        });

        render(<EventPage />);

        expect(screen.getAllByTestId("activity-display")).toHaveLength(2);
        expect(screen.getAllByTestId("comments")).toHaveLength(2);
    });
    it("renders an ActivityDisplay for each scheduledActivity", async () => {
        ActivitiesContainer.mockImplementation(({ children }) => {
            const scheduledActivities = [
                {
                    id: 1,
                    name: "Activity 1",
                    description: "Description 1",
                },
                {
                    id: 2,
                    name: "Activity 2",
                    description: "Description 2",
                },
            ];
            const unscheduledActivities = [];

            // Handle the case where children is an array with a function (due to JSX whitespace)
            let renderFunction = null;
            if (typeof children === "function") {
                renderFunction = children;
            } else if (Array.isArray(children)) {
                renderFunction = children.find(
                    (child) => typeof child === "function",
                );
            }

            if (renderFunction) {
                return renderFunction({
                    scheduledActivities,
                    unscheduledActivities,
                    activities: [
                        ...scheduledActivities,
                        ...unscheduledActivities,
                    ],
                    isLoading: false,
                    createActivity: jest.fn(),
                    deleteActivity: jest.fn(),
                    editActivity: jest.fn(),
                    moveActivity: jest.fn(),
                    moveActivityUp: jest.fn(),
                    moveActivityDown: jest.fn(),
                    undoLastMove: jest.fn(),
                    hasUndo: false,
                    clearUndo: jest.fn(),
                });
            }
            return <div data-testid="activities-container">{children}</div>;
        });

        render(<EventPage />);

        expect(screen.getAllByTestId("activity-display")).toHaveLength(2);
        expect(screen.getAllByTestId("comments")).toHaveLength(2);
    });
    describe("move up", () => {
        beforeEach(() => {
            ActivitiesContainer.mockImplementation(({ children }) => {
                // Handle the case where children is an array with a function (due to JSX whitespace)
                let renderFunction = null;
                if (typeof children === "function") {
                    renderFunction = children;
                } else if (Array.isArray(children)) {
                    renderFunction = children.find(
                        (child) => typeof child === "function",
                    );
                }

                if (renderFunction) {
                    return renderFunction({
                        scheduledActivities: [
                            {
                                id: 1,
                                name: "Activity 1",
                                description: "Description 1",
                                scheduleIndex: 0,
                            },
                            {
                                id: 2,
                                name: "Activity 2",
                                description: "Description 2",
                                scheduleIndex: 1,
                            },
                        ],
                        unscheduledActivities: [
                            {
                                id: 3,
                                name: "Activity 3",
                                description: "Description 3",
                                sortIndex: 2,
                            },
                            {
                                id: 4,
                                name: "Activity 4",
                                description: "Description 4",
                                sortIndex: 3,
                            },
                        ],
                        activities: [],
                        isLoading: false,
                        createActivity: jest.fn(),
                        editActivity: jest.fn(),
                        deleteActivity: jest.fn(),
                        moveActivity: jest.fn(),
                        moveActivityUp: jest.fn(),
                        moveActivityDown: jest.fn(),
                        undoLastMove: jest.fn(),
                        hasUndo: false,
                        clearUndo: jest.fn(),
                    });
                }
                return <div data-testid="activities-container">{children}</div>;
            });
            ActivityDisplay.mockImplementation(({ onMoveUp }) => {
                return (
                    <div data-testid="hasMoveUp">
                        {onMoveUp ? "has move up" : "no move up"}
                    </div>
                );
            });
        });
        it("provides the moveUp function to activities in the schedule", async () => {
            render(<EventPage />);
            const activities = await screen.findAllByTestId("hasMoveUp");
            expect(activities[1]).toHaveTextContent("has move up");
        });
        it("does not provide the moveUp function to activities at the top of the schedule", async () => {
            render(<EventPage />);
            const activities = await screen.findAllByTestId("hasMoveUp");
            expect(activities[0]).toHaveTextContent("no move up");
        });
        it("provides the moveUp function to unscheduled activities", async () => {
            render(<EventPage />);
            const activities = await screen.findAllByTestId("hasMoveUp");
            expect(activities[3]).toHaveTextContent("has move up");
        });
        it("does not provide the moveUp function to activities at the top of the unscheduled activities", async () => {
            render(<EventPage />);
            const activities = await screen.findAllByTestId("hasMoveUp");
            expect(activities[2]).toHaveTextContent("no move up");
        });
    });
    describe("move down", () => {
        beforeEach(() => {
            ActivitiesContainer.mockImplementation(({ children }) => {
                // Handle the case where children is an array with a function (due to JSX whitespace)
                let renderFunction = null;
                if (typeof children === "function") {
                    renderFunction = children;
                } else if (Array.isArray(children)) {
                    renderFunction = children.find(
                        (child) => typeof child === "function",
                    );
                }

                if (renderFunction) {
                    return renderFunction({
                        scheduledActivities: [
                            {
                                id: 1,
                                name: "Activity 1",
                                description: "Description 1",
                                scheduleIndex: 0,
                            },
                            {
                                id: 2,
                                name: "Activity 2",
                                description: "Description 2",
                                scheduleIndex: 1,
                            },
                        ],
                        unscheduledActivities: [
                            {
                                id: 3,
                                name: "Activity 3",
                                description: "Description 3",
                                sortIndex: 2,
                            },
                            {
                                id: 4,
                                name: "Activity 4",
                                description: "Description 4",
                                sortIndex: 3,
                            },
                        ],
                        activities: [],
                        isLoading: false,
                        createActivity: jest.fn(),
                        editActivity: jest.fn(),
                        deleteActivity: jest.fn(),
                        moveActivity: jest.fn(),
                        moveActivityUp: jest.fn(),
                        moveActivityDown: jest.fn(),
                        undoLastMove: jest.fn(),
                        hasUndo: false,

                        clearUndo: jest.fn(),
                    });
                }
                return <div data-testid="activities-container">{children}</div>;
            });
            ActivityDisplay.mockImplementation(({ onMoveDown }) => {
                return (
                    <div data-testid="hasMoveDown">
                        {onMoveDown ? "has move down" : "no move down"}
                    </div>
                );
            });
        });
        it("provides the moveDown function to activities in the schedule", async () => {
            render(<EventPage />);
            const activities = await screen.findAllByTestId("hasMoveDown");
            expect(activities[0]).toHaveTextContent("has move down");
        });
        it("does not provide the moveDown function to activities at the bottom of the schedule", async () => {
            render(<EventPage />);
            const activities = await screen.findAllByTestId("hasMoveDown");
            expect(activities[1]).toHaveTextContent("no move down");
        });
        it("provides the moveDown function to unscheduled activities", async () => {
            render(<EventPage />);
            const activities = await screen.findAllByTestId("hasMoveDown");
            expect(activities[2]).toHaveTextContent("has move down");
        });
        it("does not provide the moveDown function to activities at the botto of the unscheduled activities", async () => {
            render(<EventPage />);
            const activities = await screen.findAllByTestId("hasMoveDown");
            expect(activities[3]).toHaveTextContent("no move down");
        });
    });
});
