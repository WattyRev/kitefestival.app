import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentsContainer from "../CommentsContainer";
import fetch from "../../util/fetch";
import { useAlert } from "../ui/Alert";
import { useChangePolling } from "../ChangePollingContainer";
import { useAuth } from "../global/Auth";

jest.mock("../../util/fetch");
jest.mock("../ui/Alert");
jest.mock("../ChangePollingContainer");
jest.mock("../global/Auth");

describe("CommentsContainer auth errors", () => {
  let openAlert;
  beforeEach(() => {
    useAuth.mockReturnValue({ auth: { userType: "editor" } });
    useChangePolling.mockReturnValue({ changes: [] });
    openAlert = jest.fn();
    useAlert.mockReturnValue({ openAlert });
    fetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ comments: [] }) });
  });

  it("shows sign-in message on 401 for create", async () => {
    fetch.mockImplementation((url, options = {}) => {
      if (url === "/api/comments" && options.method === "POST") {
        return Promise.resolve({ ok: false, status: 401 });
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ comments: [] }) });
    });
    render(
      <CommentsContainer>
        {({ createComment }) => (
          <button onClick={() => createComment({ message: "m", activityId: "a" })}>create</button>
        )}
      </CommentsContainer>
    );
    await userEvent.click(screen.getByText("create"));
    expect(openAlert).toHaveBeenCalledWith(
      "Please sign in to comment (enter editor or user passcode).",
      "error"
    );
  });

  it("shows re-enter message on 403 for create", async () => {
    fetch.mockImplementation((url, options = {}) => {
      if (url === "/api/comments" && options.method === "POST") {
        return Promise.resolve({ ok: false, status: 403 });
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ comments: [] }) });
    });
    render(
      <CommentsContainer>
        {({ createComment }) => (
          <button onClick={() => createComment({ message: "m", activityId: "a" })}>create</button>
        )}
      </CommentsContainer>
    );
    await userEvent.click(screen.getByText("create"));
    expect(openAlert).toHaveBeenCalledWith(
      "Your passcode is invalid or expired. Please re-enter it.",
      "error"
    );
  });

  it("shows sign-in message on 401 for edit", async () => {
    fetch.mockImplementation((url, options = {}) => {
      if (url === "/api/comments/1" && options.method === "PATCH") {
        return Promise.resolve({ ok: false, status: 401 });
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ comments: [] }) });
    });
    render(
      <CommentsContainer>
        {({ editComment }) => (
          <button onClick={() => editComment(1, "updated")}>edit</button>
        )}
      </CommentsContainer>
    );
    await userEvent.click(screen.getByText("edit"));
    expect(openAlert).toHaveBeenCalledWith("Please sign in to edit your comment.", "error");
  });

  it("shows ownership message on 403 for edit", async () => {
    fetch.mockImplementation((url, options = {}) => {
      if (url === "/api/comments/1" && options.method === "PATCH") {
        return Promise.resolve({ ok: false, status: 403 });
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ comments: [] }) });
    });
    render(
      <CommentsContainer>
        {({ editComment }) => (
          <button onClick={() => editComment(1, "updated")}>edit</button>
        )}
      </CommentsContainer>
    );
    await userEvent.click(screen.getByText("edit"));
    expect(openAlert).toHaveBeenCalledWith("You can only edit your own comment.", "error");
  });

  it("shows sign-in message on 401 for delete", async () => {
    fetch.mockImplementation((url, options = {}) => {
      if (url === "/api/comments/1" && options.method === "DELETE") {
        return Promise.resolve({ ok: false, status: 401 });
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ comments: [] }) });
    });
    render(
      <CommentsContainer>
        {({ deleteComment }) => (
          <button onClick={() => deleteComment(1)}>delete</button>
        )}
      </CommentsContainer>
    );
    await userEvent.click(screen.getByText("delete"));
    expect(openAlert).toHaveBeenCalledWith("Please sign in to delete your comment.", "error");
  });

  it("shows ownership message on 403 for delete", async () => {
    fetch.mockImplementation((url, options = {}) => {
      if (url === "/api/comments/1" && options.method === "DELETE") {
        return Promise.resolve({ ok: false, status: 403 });
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ comments: [] }) });
    });
    render(
      <CommentsContainer>
        {({ deleteComment }) => (
          <button onClick={() => deleteComment(1)}>delete</button>
        )}
      </CommentsContainer>
    );
    await userEvent.click(screen.getByText("delete"));
    expect(openAlert).toHaveBeenCalledWith("You can only delete your own comment.", "error");
  });
});
