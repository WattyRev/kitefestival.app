import { render, screen } from "@testing-library/react";
import EventListItem from "../EventListItem";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../global/Auth";
import { usePrompt } from "../ui/Prompt";
import fetchWrapper from "../../util/fetch";

jest.mock("../global/Auth");
jest.mock("../ui/Prompt");
jest.mock("../../util/fetch");

describe("EventListItem", () => {
    beforeEach(() => {
        useAuth.mockReturnValue({
            isEditor: () => true,
        });
        usePrompt.mockReturnValue({
            openPrompt: jest.fn(),
        });
        fetchWrapper.mockResolvedValue({ ok: true, json: async () => ({}) });
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

        await userEvent.click(screen.getByTitle("Delete"));

        expect(openPrompt).toHaveBeenCalledWith(
            'Are you sure you want to delete "Event 1"? This will also delete all activities and comments associated with it.',
            "confirm",
        );
        expect(fetchWrapper).toHaveBeenCalledWith(
            "/api/events/1",
            expect.objectContaining({
                method: "DELETE",
            }),
        );
        expect(onDelete).toHaveBeenCalledWith(1);
    });
    it("does not show delete button for non-editors", async () => {
        useAuth.mockReturnValue({
            isEditor: () => false,
        });
        const event = { id: 1, name: "Event 1", slug: "event_1" };
        render(<EventListItem event={event} />);
        expect(screen.queryByTitle("Delete")).not.toBeInTheDocument();
    });
});
