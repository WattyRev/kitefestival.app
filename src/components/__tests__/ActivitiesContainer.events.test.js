import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActivitiesContainer from "../ActivitiesContainer";
import fetch from "../../util/fetch";
import { useAlert } from "../ui/Alert";
import { useChangePolling } from "../ChangePollingContainer";
import { EventsProvider } from "../EventsContext";

jest.mock("../../util/fetch");
jest.mock("../ui/Alert");
jest.mock("../ChangePollingContainer");

describe("ActivitiesContainer (event scoping)", () => {
  beforeEach(() => {
    useChangePolling.mockReturnValue({ changes: [] });
    useAlert.mockReturnValue({ openAlert: jest.fn() });
    // Default fetch mock returns activities shape for POST create
    fetch.mockImplementation((url, options = {}) => {
      if (url === "/api/activities" && options.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            activities: [
              { id: "a1", title: "T", description: "D", music: [], sortIndex: 0, scheduleIndex: null, eventId: "e1" },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ activities: [] }) });
    });
  });

  it("fetches with eventId and sends eventId on create when provided via prop", async () => {
    const initial = [];
    render(
      <EventsProvider>
        <ActivitiesContainer initialActivities={initial} eventId="e1">
          {({ createActivity }) => (
            <button onClick={() => createActivity({ title: "T", description: "D", music: [] })}>create</button>
          )}
        </ActivitiesContainer>
      </EventsProvider>
    );

    // create
    await userEvent.click(screen.getByText("create"));
    expect(fetch).toHaveBeenCalledWith("/api/activities", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "T", description: "D", music: [], eventId: "e1" }),
    }));
  });
});
