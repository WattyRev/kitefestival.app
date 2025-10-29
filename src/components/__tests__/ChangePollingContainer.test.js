import { render, screen, waitFor } from "@testing-library/react";
import { getChanges } from "../../app/api/changes";
import ChangePollingContainer, {
    useChangePolling,
} from "../ChangePollingContainer";

jest.mock("../../app/api/changes");

describe("components/ChangePollingContainer", () => {
    let MockConsumer;
    beforeEach(() => {
        getChanges.mockResolvedValue({
            changes: [{ tablename: "comments" }, { tablename: "activities" }],
        });
        MockConsumer = function MockBoi() {
            const { changes } = useChangePolling();
            if (!changes?.length) {
                return <div data-testid="no-changes">no changes</div>;
            }
            return changes.map((change) => (
                <div data-testid="change" key={change.tablename}>
                    {change.tablename}
                </div>
            ));
        };
    });
    it("should provide change information", async () => {
        render(
            <ChangePollingContainer>
                <MockConsumer />
            </ChangePollingContainer>,
        );
        await waitFor(() =>
            expect(screen.queryAllByTestId("change")).toHaveLength(2),
        );
    });
    it("should handle API failure gracefully", async () => {
        getChanges.mockRejectedValue();

        render(
            <ChangePollingContainer>
                <MockConsumer />
            </ChangePollingContainer>,
        );
        await waitFor(() =>
            expect(screen.queryAllByTestId("change")).toHaveLength(0),
        );
    });
});
