import { render, screen } from "@testing-library/react";
import HomePage from "../HomePage";
import userEvent from "@testing-library/user-event";
import EventForm from "../EventForm";
import EventListItem from "../EventListItem";

const MockEventForm = (props) => (
    <div>
        EventForm
        <button onClick={() => props.onSubmit({ id: 3, name: "New Event" })}>
            Simulate Add Event
        </button>
    </div>
);

jest.mock("../EventForm");

const MockEventListItem = (props) => (
    <div>
        {props.event.name}
        <button onClick={props.onDelete}>Delete</button>
    </div>
);
jest.mock("../EventListItem");

describe("HomePage", () => {
    beforeEach(() => {
        EventForm.mockImplementation(MockEventForm);
        EventListItem.mockImplementation(MockEventListItem);
    });
    it("renders", () => {
        render(<HomePage initialEvents={[]} />);
        expect(screen.getByTestId("empty-events")).toBeInTheDocument();
    });
    it("renders a list of events", () => {
        const events = [
            { id: 1, name: "Event 1", date: "2024-07-01" },
            { id: 2, name: "Event 2", date: "2024-08-01" },
        ];
        render(<HomePage initialEvents={events} />);
        expect(screen.getByText("Event 1")).toBeInTheDocument();
        expect(screen.getByText("Event 2")).toBeInTheDocument();
    });
    it("updates the list of events when an event is deleted", async () => {
        const events = [
            { id: 1, name: "Event 1", date: "2024-07-01" },
            { id: 2, name: "Event 2", date: "2024-08-01" },
        ];
        render(<HomePage initialEvents={events} />);
        expect(screen.getByText("Event 1")).toBeInTheDocument();
        expect(screen.getByText("Event 2")).toBeInTheDocument();

        // Simulate deleting Event 1
        await userEvent.click(screen.getAllByText("Delete")[0]);

        expect(screen.queryByText("Event 1")).not.toBeInTheDocument();
        expect(screen.getByText("Event 2")).toBeInTheDocument();
    });
    it("updates the list of events when a new event is added", async () => {
        const events = [
            { id: 1, name: "Event 1", date: "2024-07-01" },
            { id: 2, name: "Event 2", date: "2024-08-01" },
        ];
        render(<HomePage initialEvents={events} />);
        expect(screen.getByText("Event 1")).toBeInTheDocument();
        expect(screen.getByText("Event 2")).toBeInTheDocument();

        // Simulate adding a new event
        await userEvent.click(screen.getByText("Simulate Add Event"));

        expect(screen.getByText("Event 1")).toBeInTheDocument();
        expect(screen.getByText("Event 2")).toBeInTheDocument();
        expect(screen.getByText("New Event")).toBeInTheDocument();
    });
});
