import { render, screen, waitFor } from "@testing-library/react";
import { AlertProvider, useAlert } from "../Alert";
import userEvent from "@testing-library/user-event";
import setTimeout from "../../../util/setTimeout";

jest.mock("../../../util/setTimeout");

describe("Alert", () => {
    it("allows a component to trigger a success alert", async () => {
        const MockConsumer = () => {
            const { openAlert } = useAlert();
            return (
                <button
                    data-testid="open-alert"
                    onClick={() => openAlert("boogers", "success")}
                >
                    Open Alert
                </button>
            );
        };
        render(
            <AlertProvider>
                <MockConsumer />
            </AlertProvider>,
        );

        await userEvent.click(screen.getByTestId("open-alert"));

        expect(screen.getByTestId("alert-message")).toHaveTextContent(
            "boogers",
        );
        expect(screen.getByTestId("alert-container")).toHaveClass("success");
    });
    it("allows a component to trigger an error alert", async () => {
        const MockConsumer = () => {
            const { openAlert } = useAlert();
            return (
                <button
                    data-testid="open-alert"
                    onClick={() => openAlert("boogers", "error")}
                >
                    Open Alert
                </button>
            );
        };
        render(
            <AlertProvider>
                <MockConsumer />
            </AlertProvider>,
        );

        await userEvent.click(screen.getByTestId("open-alert"));

        expect(screen.getByTestId("alert-message")).toHaveTextContent(
            "boogers",
        );
        expect(screen.getByTestId("alert-container")).toHaveClass("error");
    });
    it("allows a component to trigger multiple alerts", async () => {
        const MockConsumer = () => {
            const { openAlert } = useAlert();
            return (
                <button
                    data-testid="open-alert"
                    onClick={() => openAlert("boogers", "error")}
                >
                    Open Alert
                </button>
            );
        };
        render(
            <AlertProvider>
                <MockConsumer />
            </AlertProvider>,
        );

        await userEvent.click(screen.getByTestId("open-alert"));
        await userEvent.click(screen.getByTestId("open-alert"));

        expect(screen.queryAllByTestId("alert-container")).toHaveLength(2);
    });

    it("closes the alert after 5 seconds", async () => {
        let finishTimer;
        setTimeout.mockImplementation((callback) => (finishTimer = callback));
        const MockConsumer = () => {
            const { openAlert } = useAlert();
            return (
                <button
                    data-testid="open-alert"
                    onClick={() => openAlert("boogers", "error")}
                >
                    Open Alert
                </button>
            );
        };
        render(
            <AlertProvider>
                <MockConsumer />
            </AlertProvider>,
        );

        await userEvent.click(screen.getByTestId("open-alert"));
        expect(screen.queryAllByTestId("alert-container")).toHaveLength(1);
        await finishTimer();
        await waitFor(() =>
            expect(screen.queryAllByTestId("alert-container")).toHaveLength(0),
        );
    });
    it("closes the alert when the user clicks the close button", async () => {
        const MockConsumer = () => {
            const { openAlert } = useAlert();
            return (
                <button
                    data-testid="open-alert"
                    onClick={() => openAlert("boogers", "error")}
                >
                    Open Alert
                </button>
            );
        };
        render(
            <AlertProvider>
                <MockConsumer />
            </AlertProvider>,
        );
        await userEvent.click(screen.getByTestId("open-alert"));
        expect(screen.queryAllByTestId("alert-container")).toHaveLength(1);
        await userEvent.click(screen.getByTestId("alert-close"));
        expect(screen.queryAllByTestId("alert-container")).toHaveLength(0);
    });
});
