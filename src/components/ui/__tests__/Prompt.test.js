import { render, screen, waitFor } from "@testing-library/react";
import { PromptProvider, usePrompt, TEXT_INPUT_TYPES } from "../Prompt";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

describe("Prompt", () => {
    it("allows a component to trigger a prompt", async () => {
        const MockConsumer = () => {
            const { openPrompt } = usePrompt();
            return (
                <button onClick={() => openPrompt("boogers")}>
                    Open Prompt
                </button>
            );
        };
        render(
            <PromptProvider>
                <MockConsumer />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByText("Open Prompt"));

        expect(screen.getByTestId("prompt-message")).toHaveTextContent(
            "boogers",
        );
    });
    it("rejects and closes the prompt when the user clicks on the backdrop", async () => {
        const MockConsumer = () => {
            const [status, setStatus] = useState("none");
            const { openPrompt } = usePrompt();
            async function handlePrompt() {
                try {
                    await openPrompt("boogers");
                } catch {
                    setStatus("rejected");
                    return;
                }
                setStatus("resolved");
            }
            return (
                <>
                    <div data-testid="status">{status}</div>
                    <button onClick={handlePrompt}>Open Prompt</button>
                </>
            );
        };
        render(
            <PromptProvider>
                <MockConsumer />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByText("Open Prompt"));

        expect(screen.queryAllByTestId("prompt-form")).toHaveLength(1);

        await userEvent.click(screen.getByTestId("prompt-overlay"));

        expect(screen.queryAllByTestId("prompt-form")).toHaveLength(0);
        expect(screen.getByTestId("status")).toHaveTextContent("rejected");
    });
    it("rejects and closes the prompt when the user clicks on the cancel button", async () => {
        const MockConsumer = () => {
            const [status, setStatus] = useState("none");
            const { openPrompt } = usePrompt();
            async function handlePrompt() {
                try {
                    await openPrompt("boogers");
                } catch {
                    setStatus("rejected");
                    return;
                }
                setStatus("resolved");
            }
            return (
                <>
                    <div data-testid="status">{status}</div>
                    <button onClick={handlePrompt}>Open Prompt</button>
                </>
            );
        };
        render(
            <PromptProvider>
                <MockConsumer />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByText("Open Prompt"));

        expect(screen.queryAllByTestId("prompt-form")).toHaveLength(1);

        await userEvent.click(screen.getByTestId("prompt-cancel"));

        expect(screen.queryAllByTestId("prompt-form")).toHaveLength(0);
        expect(screen.getByTestId("status")).toHaveTextContent("rejected");
    });
    describe("text prompts", () => {
        it("it resolves the prompt with the user input upon submission", async () => {
            const MockConsumer = () => {
                const [value, setValue] = useState("");
                const { openPrompt } = usePrompt();
                async function handlePrompt() {
                    const response = await openPrompt("boogers");
                    setValue(response);
                }
                return (
                    <>
                        <div data-testid="value">{value}</div>
                        <button onClick={handlePrompt}>Open Prompt</button>
                    </>
                );
            };
            render(
                <PromptProvider>
                    <MockConsumer />
                </PromptProvider>,
            );

            await userEvent.click(screen.getByText("Open Prompt"));

            await userEvent.type(screen.getByTestId("prompt-input"), "jingles");
            await userEvent.click(screen.getByTestId("prompt-submit"));

            expect(screen.getByTestId("value")).toHaveTextContent("jingles");
        });
        it("uses the provided promptType as the input type", async () => {
            const MockConsumer = () => {
                const [inputType, setInputType] = useState(TEXT_INPUT_TYPES[0]);
                const { openPrompt } = usePrompt();
                function moveToNextType() {
                    const nextType =
                        TEXT_INPUT_TYPES[
                            TEXT_INPUT_TYPES.indexOf(inputType) + 1
                        ] || null;
                    setInputType(nextType);
                }
                return (
                    <>
                        <button onClick={moveToNextType} data-testid="next">
                            Move to next type
                        </button>
                        <div data-testid="type">{inputType}</div>
                        <button
                            onClick={() =>
                                openPrompt("boogers", inputType).catch(() => {})
                            }
                            data-testid="open"
                        >
                            Open Prompt
                        </button>
                    </>
                );
            };
            render(
                <PromptProvider>
                    <MockConsumer />
                </PromptProvider>,
            );

            for (const type of TEXT_INPUT_TYPES) {
                await waitFor(() =>
                    expect(screen.getByTestId("type")).toHaveTextContent(type),
                );
                await userEvent.click(screen.getByTestId("open"));
                expect(screen.getByTestId("prompt-input")).toHaveAttribute(
                    "type",
                    type,
                );
                await userEvent.click(screen.getByTestId("prompt-cancel"));
                await userEvent.click(screen.getByTestId("next"));
            }
        });
        it("uses the provided promptValue as the initial value", async () => {
            const MockConsumer = () => {
                const [value, setValue] = useState("");
                const { openPrompt } = usePrompt();
                async function handlePrompt() {
                    const response = await openPrompt(
                        "boogers",
                        "text",
                        "test",
                    );
                    setValue(response);
                }
                return (
                    <>
                        <div data-testid="value">{value}</div>
                        <button onClick={handlePrompt}>Open Prompt</button>
                    </>
                );
            };
            render(
                <PromptProvider>
                    <MockConsumer />
                </PromptProvider>,
            );

            await userEvent.click(screen.getByText("Open Prompt"));

            expect(screen.getByTestId("prompt-input")).toHaveValue("test");
        });
    });
    describe("confirm prompts", () => {
        it("it resolves the prompt upon submission", async () => {
            const MockConsumer = () => {
                const [status, setStatus] = useState("none");
                const { openPrompt } = usePrompt();
                async function handlePrompt() {
                    try {
                        await openPrompt("boogers", "confirm");
                    } catch {
                        setStatus("rejected");
                        return;
                    }
                    setStatus("resolved");
                }
                return (
                    <>
                        <div data-testid="status">{status}</div>
                        <button onClick={handlePrompt}>Open Prompt</button>
                    </>
                );
            };
            render(
                <PromptProvider>
                    <MockConsumer />
                </PromptProvider>,
            );

            await userEvent.click(screen.getByText("Open Prompt"));

            expect(screen.queryAllByTestId("prompt-form")).toHaveLength(1);
            expect(screen.queryAllByTestId("prompt-input")).toHaveLength(0);

            await userEvent.click(screen.getByTestId("prompt-submit"));

            expect(screen.queryAllByTestId("prompt-form")).toHaveLength(0);
            expect(screen.getByTestId("status")).toHaveTextContent("resolved");
        });
    });
});
