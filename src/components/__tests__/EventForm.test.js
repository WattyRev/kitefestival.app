import { render, screen } from "@testing-library/react";
import EventForm from "../EventForm";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../global/Auth";
import { useAlert } from "../ui/Alert";
import { createEvent, editEvent } from "../../app/api/events";

jest.mock("../global/Auth");
jest.mock("../ui/Alert");
jest.mock("../../app/api/events");

describe("EventForm", () => {
    beforeEach(() => {
        useAuth.mockReturnValue({
            isEditor: () => true,
        });
        useAlert.mockReturnValue({
            openAlert: jest.fn(),
        });

        editEvent.mockResolvedValue({
            event: {
                id: 1,
                name: "New Event",
                slug: "new_event",
                description: "Description",
            },
        });
        createEvent.mockResolvedValue({
            event: {
                id: 1,
                name: "New Event",
                slug: "new_event",
                description: "Description",
            },
        });
    });
    it("renders", async () => {
        render(<EventForm />);
        expect(screen.getByTestId("create-event-form")).toBeInTheDocument();
    });
    it("submits a new event", async () => {
        const handleSubmit = jest.fn();
        render(<EventForm onSubmit={handleSubmit} />);

        await userEvent.type(screen.getByTestId("event-name"), "My New Event");
        await userEvent.type(
            screen.getByTestId("event-description"),
            "Description",
        );
        await userEvent.click(screen.getByTestId("save-event"));

        expect(createEvent).toHaveBeenCalledWith({
            name: "My New Event",
            slug: "my_new_event",
            description: "Description",
        });
        expect(handleSubmit).toHaveBeenCalledWith({
            id: 1,
            name: "New Event",
            slug: "new_event",
            description: "Description",
        });
    });
    describe("when editing an event", () => {
        it("renders with initial values", () => {
            render(
                <EventForm
                    isEdit
                    initialEvent={{
                        id: 2,
                        name: "Old Name",
                        description: "Old Desc",
                    }}
                />,
            );
            expect(screen.getByTestId("create-event-form")).toBeInTheDocument();
        });
        it("submits updated event data", async () => {
            const handleSubmit = jest.fn();
            render(
                <EventForm
                    isEdit
                    initialEvent={{
                        id: 2,
                        name: "Old Name",
                        description: "Old Desc",
                    }}
                    onSubmit={handleSubmit}
                />,
            );

            await userEvent.clear(screen.getByTestId("event-name"));
            await userEvent.type(
                screen.getByTestId("event-name"),
                "Updated Name",
            );
            await userEvent.clear(screen.getByTestId("event-description"));
            await userEvent.type(
                screen.getByTestId("event-description"),
                "Updated Desc",
            );
            await userEvent.click(screen.getByTestId("save-event"));

            expect(editEvent).toHaveBeenCalledWith(2, {
                name: "Updated Name",
                description: "Updated Desc",
            });
            expect(handleSubmit).toHaveBeenCalledWith({
                id: 1,
                name: "New Event",
                slug: "new_event",
                description: "Description",
            });
        });
    });
});
