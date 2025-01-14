import { render, screen } from "@testing-library/react";
import Pane, { PaneProvider } from "../Pane";
import userEvent from "@testing-library/user-event";

describe('Pane', () => {
    it('renders', async () => {
        render(
            <PaneProvider>
                <Pane
                    paneId="test"
                    trigger={({ openPane }) => (
                        <button data-testid="open" onClick={openPane} />
                    )}
                >
                    <p data-testid="content">Content</p>
                </Pane>
            </PaneProvider>
        )

        expect(screen.queryByTestId('open')).toBeInTheDocument();
    });
    it('opens with the provided content', async () => {
        render(
            <PaneProvider>
                <Pane
                    paneId="test"
                    trigger={({ openPane }) => (
                        <button data-testid="open" onClick={openPane} />
                    )}
                >
                    <p data-testid="content">Content</p>
                </Pane>
            </PaneProvider>
        );

        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
        await userEvent.click(screen.getByTestId('open'));
        expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    it('can be closed by the trigger', async () => {
        render(
            <PaneProvider>
                <Pane
                    paneId="test"
                    trigger={({ openPane, closePane }) => (
                        <>
                            <button data-testid="open" onClick={openPane} />
                            <button data-testid="close" onClick={closePane} />
                        </>
                    )}
                >
                    <p data-testid="content">Content</p>
                </Pane>
            </PaneProvider>
        );

        await userEvent.click(screen.getByTestId('open'));
        expect(screen.getByTestId('content')).toBeInTheDocument();
        await userEvent.click(screen.getByTestId('close'));
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
    it('can be closed by the close button', async () => {
        render(
            <PaneProvider>
                <Pane
                    paneId="test"
                    trigger={({ openPane }) => (
                        <button data-testid="open" onClick={openPane} />
                    )}
                >
                    <p data-testid="content">Content</p>
                </Pane>
            </PaneProvider>
        );

        await userEvent.click(screen.getByTestId('open'));
        expect(screen.getByTestId('content')).toBeInTheDocument();
        await userEvent.click(screen.getByTestId('close-pane'));
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
    it('only opens one pane at a time', async () => {
        render(
            <PaneProvider>
                <Pane
                    paneId="test1"
                    trigger={({ openPane, isOpen }) => (
                        <>
                            <button data-testid="open1" onClick={openPane} />
                            <div data-testid="isOpen1">{isOpen ? 'true' : 'false'}</div>
                        </>
                    )}
                >
                    <p data-testid="content1">Content</p>
                </Pane>
                <Pane
                    paneId="test2"
                    trigger={({ openPane, isOpen }) => (
                        <>
                            <button data-testid="open2" onClick={openPane} />
                            <div data-testid="isOpen2">{isOpen ? 'true' : 'false'}</div>
                        </>
                    )}
                >
                    <p data-testid="content2">Content</p>
                </Pane>
            </PaneProvider>
        );

        await userEvent.click(screen.getByTestId('open1'));
        expect(screen.getByTestId('isOpen1')).toHaveTextContent('true');
        expect(screen.queryByTestId('content1')).toBeInTheDocument();
        expect(screen.getByTestId('isOpen2')).toHaveTextContent('false');
        expect(screen.queryByTestId('content2')).not.toBeInTheDocument();

        await userEvent.click(screen.getByTestId('open2'));
        expect(screen.getByTestId('isOpen2')).toHaveTextContent('true');
        expect(screen.queryByTestId('content2')).toBeInTheDocument();
        expect(screen.getByTestId('isOpen1')).toHaveTextContent('false');
        expect(screen.queryByTestId('content1')).not.toBeInTheDocument();
    });
});