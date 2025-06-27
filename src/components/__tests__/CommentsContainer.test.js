import { render, screen, waitFor } from "@testing-library/react";
import fetch from "../../util/fetch";
import { useAlert } from "../ui/Alert";
import { useChangePolling } from "../ChangePollingContainer";
import { useAuth } from "../global/Auth";
import CommentsContainer from "../CommentsContainer";
import userEvent from "@testing-library/user-event";

jest.mock("../ui/Alert");
jest.mock("../../util/fetch");
jest.mock("../ChangePollingContainer");
jest.mock("../global/Auth");

describe("components/CommentsContainer", () => {
    beforeEach(() => {
        useAuth.mockReturnValue({
            auth: {
                userType: "editor",
            },
        });
        useChangePolling.mockReturnValue({
            changes: [],
        });
        useAlert.mockReturnValue({
            openAlert: jest.fn(),
        });
        fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                comments: [
                    {
                        id: 1,
                        message: "boogers",
                        activityId: "activity-1",
                    },
                    {
                        id: 2,
                        message: "more boogers",
                        activityId: "activity-1",
                    },
                    {
                        id: 3,
                        message: "something else",
                        activityId: "activity-2",
                    },
                ],
            }),
        });
    });
    it("provides comments", async () => {
        render(
            <CommentsContainer>
                {({ comments }) =>
                    comments.map((comment) => (
                        <div data-testid="comment" key={comment.id}>
                            {comment.message}
                        </div>
                    ))
                }
            </CommentsContainer>,
        );

        await waitFor(() =>
            expect(screen.queryAllByTestId("comment")).toHaveLength(3),
        );
    });
    it("provides comments indexed by activity id", async () => {
        render(
            <CommentsContainer>
                {({ commentsByActivityId }) =>
                    commentsByActivityId?.["activity-1"]?.map((comment) => (
                        <div data-testid="comment" key={comment.id}>
                            {comment.message}
                        </div>
                    ))
                }
            </CommentsContainer>,
        );

        await waitFor(() =>
            expect(screen.queryAllByTestId("comment")).toHaveLength(2),
        );
    });
    it("indicates when it is loading", async () => {
        let resolveFetch;
        fetch.mockImplementation(() => {
            return new Promise((resolve) => {
                resolveFetch = resolve;
            });
        });
        render(
            <CommentsContainer>
                {({ isLoading }) => (
                    <div data-testid="isLoading">
                        {isLoading ? "true" : "false"}
                    </div>
                )}
            </CommentsContainer>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("isLoading")).toHaveTextContent("true"),
        );

        resolveFetch({
            ok: true,
            json: jest.fn().mockResolvedValue({
                comments: [
                    {
                        id: 1,
                        message: "boogers",
                        activityId: "activity-1",
                    },
                    {
                        id: 2,
                        message: "more boogers",
                        activityId: "activity-1",
                    },
                    {
                        id: 3,
                        message: "something else",
                        activityId: "activity-2",
                    },
                ],
            }),
        });

        await waitFor(() =>
            expect(screen.getByTestId("isLoading")).toHaveTextContent("false"),
        );
    });
    it("allows the user to create a comment", async () => {
        render(
            <CommentsContainer>
                {({ comments, commentsByActivityId, createComment }) => (
                    <>
                        {comments.map((comment) => (
                            <div data-testid="comment" key={comment.id}>
                                {comment.message}
                            </div>
                        ))}
                        {commentsByActivityId?.["activity-1"]?.map(
                            (comment) => (
                                <div
                                    data-testid="activity-1-comment"
                                    key={comment.id}
                                >
                                    {comment.message}
                                </div>
                            ),
                        )}
                        <button
                            data-testid="create-comment"
                            onClick={() =>
                                createComment({
                                    message: "new boogers",
                                    activityId: "activity-1",
                                })
                            }
                        >
                            create comment
                        </button>
                    </>
                )}
            </CommentsContainer>,
        );

        await waitFor(() =>
            expect(screen.queryAllByTestId("comment")).toHaveLength(3),
        );
        await waitFor(() =>
            expect(screen.queryAllByTestId("activity-1-comment")).toHaveLength(
                2,
            ),
        );

        await userEvent.click(screen.getByTestId("create-comment"));

        await waitFor(() =>
            expect(screen.queryAllByTestId("comment")).toHaveLength(4),
        );
        await waitFor(() =>
            expect(screen.queryAllByTestId("activity-1-comment")).toHaveLength(
                3,
            ),
        );
    });
    it("allows the user to delete a comment", async () => {
        render(
            <CommentsContainer>
                {({ comments, commentsByActivityId, deleteComment }) => (
                    <>
                        {comments.map((comment) => (
                            <div data-testid="comment" key={comment.id}>
                                {comment.message}
                            </div>
                        ))}
                        {commentsByActivityId?.["activity-1"]?.map(
                            (comment) => (
                                <div
                                    data-testid="activity-1-comment"
                                    key={comment.id}
                                >
                                    {comment.message}
                                </div>
                            ),
                        )}
                        <button
                            data-testid="delete-comment"
                            onClick={() => deleteComment(1)}
                        >
                            delete comment
                        </button>
                    </>
                )}
            </CommentsContainer>,
        );

        await waitFor(() =>
            expect(screen.queryAllByTestId("comment")).toHaveLength(3),
        );
        await waitFor(() =>
            expect(screen.queryAllByTestId("activity-1-comment")).toHaveLength(
                2,
            ),
        );

        await userEvent.click(screen.getByTestId("delete-comment"));

        await waitFor(() =>
            expect(screen.queryAllByTestId("comment")).toHaveLength(2),
        );
        await waitFor(() =>
            expect(screen.queryAllByTestId("activity-1-comment")).toHaveLength(
                1,
            ),
        );
    });
    it("allows the user to edit a comment", async () => {
        render(
            <CommentsContainer>
                {({ comments, editComment }) => (
                    <>
                        <div data-testid="comment">{comments[0]?.message}</div>)
                        <button
                            data-testid="edit-comment"
                            onClick={() => editComment(1, "edited boogers")}
                        >
                            edit comment
                        </button>
                    </>
                )}
            </CommentsContainer>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("comment")).toHaveTextContent("boogers"),
        );

        await userEvent.click(screen.getByTestId("edit-comment"));

        await waitFor(() =>
            expect(screen.getByTestId("comment")).toHaveTextContent(
                "edited boogers",
            ),
        );
    });
});
