import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventsProvider, useEvents } from "../EventsContext";

describe("EventsContext", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const Consumer = () => {
    const { events, activeEvent, isLoading, error, setActiveEvent, refreshEvents } = useEvents();
    return (
      <div>
        <div data-testid="count">{events.length}</div>
        <div data-testid="active">{activeEvent?.id || ""}</div>
        <div data-testid="loading">{isLoading ? "true" : "false"}</div>
        <div data-testid="error">{error || ""}</div>
        <button onClick={() => setActiveEvent("e2")}>
          activate
        </button>
        <button onClick={() => refreshEvents()}>refresh</button>
      </div>
    );
  };

  it("loads events and identifies active one", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [{ id: "e1", isActive: false }, { id: "e2", isActive: true }] })
    });

    render(
      <EventsProvider>
        <Consumer />
      </EventsProvider>
    );

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("2"));
    expect(screen.getByTestId("active")).toHaveTextContent("e2");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });

  it("activates an event via API and updates local state", async () => {
    // initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [{ id: "e1", isActive: true }, { id: "e2", isActive: false }] })
    });
    // activation request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ activeEvent: { id: "e2", isActive: true } })
    });

    render(
      <EventsProvider>
        <Consumer />
      </EventsProvider>
    );

    await waitFor(() => expect(screen.getByTestId("active")).toHaveTextContent("e1"));

    await userEvent.click(screen.getByText("activate"));

    await waitFor(() => expect(screen.getByTestId("active")).toHaveTextContent("e2"));
  });

  it("surfaces activation errors", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ events: [] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: "Failed" }) });

    render(
      <EventsProvider>
        <Consumer />
      </EventsProvider>
    );

    await userEvent.click(screen.getByText("activate"));
    await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("Failed"));
  });
});
