import { render, screen } from "@testing-library/react";
import EventForm from "../EventForm";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../global/Auth";
import { useAlert } from "../ui/Alert";
import fetchWrapper from "../../util/fetch";

jest.mock("../global/Auth");
jest.mock("../ui/Alert");
jest.mock("../../util/fetch");

describe("EventForm", () => {
    beforeEach(() => {
        useAuth.mockReturnValue({
            isEditor: () => true,
        });
        useAlert.mockReturnValue({
            openAlert: jest.fn(),
        });
        fetchWrapper.mockResolvedValue({
            ok: true,
            json: async () => ({
                event: { id: 1, name: "New Event", slug: "new_event" },
            }),
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
        await userEvent.type(screen.getByTestId("event-description"), "Description");
        await userEvent.click(screen.getByTestId("save-event"));

        expect(fetchWrapper).toHaveBeenCalledWith(
            "/api/events",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    event: {
                        name: "My New Event",
                        slug: "my_new_event",
                        description: 'Description',
                    },
                }),
            }),
        );
        expect(handleSubmit).toHaveBeenCalledWith({
            id: 1,
            name: "New Event",
            slug: "new_event",
        });
    });
    it("shows an alert if submission fails", async () => {});
});
