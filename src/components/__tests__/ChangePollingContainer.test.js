import { render, screen, waitFor } from '@testing-library/react';
import fetch from '../../util/fetch';
import ChangePollingContainer, { useChangePolling } from '../ChangePollingContainer';

jest.mock('../../util/fetch');

describe('components/ChangePollingContainer', () => {
    let MockConsumer;
    beforeEach(() => {
        fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                changes: [
                    { tablename: 'comments' },
                    { tablename: 'activities' }
                ]
            })
        });
        MockConsumer = function MockBoi() {
            const { changes } = useChangePolling();
            if (!changes?.length) {
                return <div data-testid="no-changes">no changes</div>;
            }
            return changes.map(change => (
                <div data-testid="change" key={change.tablename}>{change.tablename}</div>
            ));
        }
    })
    it('should provide change information', async () => {
        render(<ChangePollingContainer><MockConsumer /></ChangePollingContainer>);
        await waitFor(() => expect(screen.queryAllByTestId('change')).toHaveLength(2));
    });
    it('should handle API failure gracefully', async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: jest.fn().mockResolvedValue({
                changes: [
                    { tablename: 'comments' },
                    { tablename: 'activities' }
                ]
            })
        });
        render(<ChangePollingContainer><MockConsumer /></ChangePollingContainer>);
        await waitFor(() => expect(screen.queryAllByTestId('change')).toHaveLength(0));
    });
})