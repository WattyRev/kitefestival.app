import { sql } from "@vercel/postgres";
import EventPage from "../page";
import { render } from "@testing-library/react";

jest.mock("@vercel/postgres", () => ({ sql: jest.fn() }));
jest.mock("../../../../components/HomePage", () => ({
    __esModule: true,
    default: ({ activities, musicLibrary }) => (
        <div>
            <div data-testid="a-count">{activities.length}</div>
            <div data-testid="m-count">{musicLibrary.length}</div>
        </div>
    ),
}));

describe("EventPage", () => {
    it("maps rows to props and parses JSON music", async () => {
        sql.mockResolvedValueOnce({
            rows: [
                {
                    id: "a1",
                    title: "T",
                    description: "D",
                    sortindex: 0,
                    scheduleindex: null,
                    music: '["s1","s2"]',
                },
            ],
        }).mockResolvedValueOnce({ rows: [{ id: "m1", value: "Song 1" }] });

        const ui = await EventPage({ params: { eventId: "e1" } });
        const { getByTestId } = render(ui);
        expect(getByTestId("a-count")).toHaveTextContent("1");
        expect(getByTestId("m-count")).toHaveTextContent("1");
    });

    it("falls back to array when music is not JSON", async () => {
        sql.mockResolvedValueOnce({
            rows: [
                {
                    id: "a1",
                    title: "T",
                    description: "D",
                    sortindex: 0,
                    scheduleindex: null,
                    music: "Not JSON",
                },
            ],
        }).mockResolvedValueOnce({ rows: [] });

        const ui = await EventPage({ params: { eventId: "e1" } });
        // Render to ensure no crash
        render(ui);
    });
});
