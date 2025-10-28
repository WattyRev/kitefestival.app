import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogsPage from "../LogsPage";
import { getLogs } from "../../app/api/actionLog";
import downloadAsCsv from "../../util/downloadAsCsv";

jest.mock("../../app/api/actionLog");
jest.mock("../../util/downloadAsCsv");

describe("logsPage", () => {
    const mockLogs = [
        {
            id: 1,
            timestamp: new Date("2024-07-01T12:00:00Z"),
            action: "Created event",
            event: "Kite Festival",
            eventId: 1,
            activity: null,
            activityId: null,
        },
        {
            id: 2,
            timestamp: new Date("2024-07-02T13:00:00Z"),
            action: "Added activity",
            event: "Kite Festival",
            eventId: 1,
            activity: "Setup",
            activityId: 101,
        },
    ];
    const mockEvents = [{ id: 1, name: "Kite Festival" }];
    beforeEach(() => {
        getLogs.mockResolvedValue(mockLogs);
    });
    it("renders", () => {
        render(<LogsPage logs={mockLogs} events={mockEvents} />);

        const eventFilterElement = screen.getByTestId("event-filter");
        expect(eventFilterElement.children.length).toEqual(2);
        expect(screen.getAllByTestId("log-row")).toHaveLength(2);
    });
    it("allows filtering by event id", async () => {
        render(<LogsPage logs={mockLogs} events={mockEvents} />);

        await userEvent.selectOptions(screen.getByTestId("event-filter"), "1");

        expect(getLogs).toHaveBeenCalledWith({ eventId: "1" });
    });
    it("allows filtering by action text", async () => {
        render(<LogsPage logs={mockLogs} events={mockEvents} />);

        const actionInput = screen.getByTestId("action-filter");
        await userEvent.type(actionInput, "Created");

        expect(getLogs).toHaveBeenCalledWith({ actionContains: "Created" });
    });
    it("allows downloading CSV of filtered logs", async () => {
        const firstPageLogs = Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            timestamp: new Date(`2024-07-01T12:00:00Z`),
            action: `Action ${i + 1}`,
            event: "Kite Festival",
            eventId: 1,
            activity: null,
            activityId: null,
        }));
        // Mock page load request
        getLogs.mockResolvedValueOnce(mockLogs);
        // Mock first page of download
        getLogs.mockResolvedValueOnce(firstPageLogs);
        // Default to regular mock for second page download

        render(<LogsPage logs={mockLogs} events={mockEvents} />);

        const downloadButton = screen.getByTestId("download-csv");
        await userEvent.click(downloadButton);

        expect(getLogs).toHaveBeenCalledWith({ limit: 100, offset: 0 });
        expect(getLogs).toHaveBeenCalledWith({ limit: 100, offset: 100 });
        expect(downloadAsCsv).toHaveBeenCalled();
        const mockCsvContent = downloadAsCsv.mock.calls[0][0];
        expect(mockCsvContent.split("\n")).toHaveLength(103);
    });
});
