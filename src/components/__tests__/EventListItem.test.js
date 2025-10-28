import { render, screen } from "@testing-library/react";
import EventListItem from "../EventListItem";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../global/Auth";
import { usePrompt } from "../ui/Prompt";
import EventForm from "../EventForm";
import { deleteEvent } from "../../app/api/events";

jest.mock("../global/Auth");
jest.mock("../ui/Prompt");
jest.mock("../EventForm");
jest.mock("../../app/api/events");

describe("EventListItem", () => {
    beforeEach(() => {
        useAuth.mockReturnValue({
            isEditor: () => true,
        });
        usePrompt.mockReturnValue({
            openPrompt: jest.fn(),
        });
        deleteEvent.mockResolvedValue({});
    });
    it("renders", async () => {
        const event = { id: 1, name: "Event 1", slug: "event_1" };
        render(<EventListItem event={event} />);
        expect(screen.getByText("Event 1")).toBeInTheDocument();
        expect(screen.getByRole("link")).toHaveAttribute(
            "href",
            "/event/event_1",
        );
    });
    it("calls onDelete when delete is confirmed", async () => {
        const event = { id: 1, name: "Event 1", slug: "event_1" };
        const onDelete = jest.fn();
        const openPrompt = jest.fn().mockResolvedValue(true);
        usePrompt.mockReturnValue({ openPrompt });
        render(<EventListItem event={event} onDelete={onDelete} />);

        await userEvent.click(screen.getByTestId("event-dropdown"));
        await userEvent.click(screen.getByTestId("delete-event"));

        expect(openPrompt).toHaveBeenCalledWith(
            'Are you sure you want to delete "Event 1"? This will also delete all activities and comments associated with it.',
            "confirm",
        );
        expect(deleteEvent).toHaveBeenCalledWith(1);
        expect(onDelete).toHaveBeenCalledWith(1);
    });
    it("calls onEdit when event is edited", async () => {
        EventForm.mockImplementation(({ onSubmit }) => (
            <button
                onClick={() =>
                    onSubmit({
                        id: 1,
                        name: "Edited Event",
                        slug: "edited_event",
                        description: "edited description",
                    })
                }
                data-testid="submit-event"
            >
                Submit
            </button>
        ));

        const event = { id: 1, name: "Event 1", slug: "event_1" };
        const onEdit = jest.fn();
        render(<EventListItem event={event} onEdit={onEdit} />);

        await userEvent.click(screen.getByTestId("event-dropdown"));
        await userEvent.click(screen.getByTestId("edit-event"));

        // Simulate editing the event in the modal
        await userEvent.click(screen.getByTestId("submit-event"));

        expect(onEdit).toHaveBeenCalledWith({
            id: 1,
            name: "Edited Event",
            slug: "edited_event",
            description: "edited description",
        });
    });
    it("does not show the action dropdown", async () => {
        useAuth.mockReturnValue({
            isEditor: () => false,
        });
        const event = { id: 1, name: "Event 1", slug: "event_1" };
        render(<EventListItem event={event} />);
        expect(screen.queryByTestId("event-dropdown")).not.toBeInTheDocument();
    });
});
