import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActivitiesContainer from "../ActivitiesContainer";
import fetch from "../../util/fetch";
import { useAlert } from "../ui/Alert";
import { useChangePolling } from "../ChangePollingContainer";

jest.mock("../../util/fetch");
jest.mock("../ui/Alert");
jest.mock("../ChangePollingContainer");

describe("ActivitiesContainer auth errors", () => {
  let openAlert;
  beforeEach(() => {
    useChangePolling.mockReturnValue({ changes: [] });
    openAlert = jest.fn();
    useAlert.mockReturnValue({ openAlert });
    fetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });
  });

  const initialActivities = [];

  it("shows sign-in message on 401 when creating", async () => {
    fetch.mockImplementation((url, options = {}) => {
      if (url === "/api/activities" && options.method === "POST") {
        return Promise.resolve({ ok: false, status: 401 });
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({}) });
    });

    render(
      <ActivitiesContainer initialActivities={initialActivities}>
        {({ createActivity }) => (
          <button onClick={() => createActivity({ title: "T", description: "D", music: [] })}>
            create
          </button>
        )}
      </ActivitiesContainer>
    );

    await userEvent.click(screen.getByText("create"));
    expect(openAlert).toHaveBeenCalledWith("Please sign in to create activities.", "error");
  });

  it("asks for editor passcode on 403 when creating", async () => {
    fetch.mockImplementation((url, options = {}) => {
      if (url === "/api/activities" && options.method === "POST") {
        return Promise.resolve({ ok: false, status: 403 });
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({}) });
    });

    render(
      <ActivitiesContainer initialActivities={initialActivities}>
        {({ createActivity }) => (
          <button onClick={() => createActivity({ title: "T", description: "D", music: [] })}>
            create
          </button>
        )}
      </ActivitiesContainer>
    );

    await userEvent.click(screen.getByText("create"));
    expect(openAlert).toHaveBeenCalledWith(
      "You must be an editor to create activities. Please re-enter the editor passcode.",
      "error"
    );
  });
});
