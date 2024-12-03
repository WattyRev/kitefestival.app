import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../Auth';
import userEvent from '@testing-library/user-event';

describe('Auth', () => {
    it('provides auth information based on local storage', async () => {
        window.localStorage.setItem('authentication', JSON.stringify({ userType: 'editor', passcode: 'cool passcode', setTime: new Date().getTime() }));
        const MockConsumer = () => {
            const { auth } = useAuth();
            return (
                <div data-testid="user-type">{auth.userType}</div>
            )
        };

        render(<AuthProvider><MockConsumer /></AuthProvider>);

        expect(screen.getByTestId('user-type')).toHaveTextContent('editor');
    });
    it('allows the user to set the authentication to local storage', async () => {
        const MockConsumer = () => {
            const { setAuthentication } = useAuth();
            return (
                <button data-testid="set" onClick={() => setAuthentication({ userType: 'user', passcode: 'cooler passcode' })}>Set</button>
            )
        };

        render(<AuthProvider><MockConsumer /></AuthProvider>);

        await userEvent.click(screen.getByTestId('set'));

        const storedAuth = JSON.parse(window.localStorage.getItem('authentication'));
        expect(storedAuth).toEqual({ userType: 'user', passcode: 'cooler passcode', setTime: expect.any(Number) });
    });
    it('allows the user to clear the authentication from local storage', async () => {
        window.localStorage.setItem('authentication', JSON.stringify({ userType: 'editor', passcode: 'cool passcode', setTime: new Date().getTime() }));
        const MockConsumer = () => {
            const { clearAuthentication } = useAuth();
            return (
                <button data-testid="clear" onClick={clearAuthentication}>Clear</button>
            )
        };

        render(<AuthProvider><MockConsumer /></AuthProvider>);

        await userEvent.click(screen.getByTestId('clear'));

        expect(window.localStorage.getItem('authentication')).toBe(null);
    });
    it('allows the user to check if the user is an editor', async () => {
        window.localStorage.setItem('authentication', JSON.stringify({ userType: 'editor', passcode: 'cool passcode', setTime: new Date().getTime() }));

        const MockConsumer = () => {
            const { isEditor, isUser, isPublic } = useAuth();
            return (
                <>
                    <div data-testid="is-editor">{isEditor() ? 'true' : 'false'}</div>
                    <div data-testid="is-user">{isUser() ? 'true' : 'false'}</div>
                    <div data-testid="is-public">{isPublic() ? 'true' : 'false'}</div>
                </>
            )
        };

        render(<AuthProvider><MockConsumer /></AuthProvider>);

        expect(screen.getByTestId('is-editor')).toHaveTextContent('true');
        expect(screen.getByTestId('is-user')).toHaveTextContent('false');
        expect(screen.getByTestId('is-public')).toHaveTextContent('false');
    });
    it('allows the user to check if the user is a user', async () => {
        window.localStorage.setItem('authentication', JSON.stringify({ userType: 'user', passcode: 'cool passcode', setTime: new Date().getTime() }));

        const MockConsumer = () => {
            const { isEditor, isUser, isPublic } = useAuth();
            return (
                <>
                    <div data-testid="is-editor">{isEditor() ? 'true' : 'false'}</div>
                    <div data-testid="is-user">{isUser() ? 'true' : 'false'}</div>
                    <div data-testid="is-public">{isPublic() ? 'true' : 'false'}</div>
                </>
            )
        };

        render(<AuthProvider><MockConsumer /></AuthProvider>);

        expect(screen.getByTestId('is-editor')).toHaveTextContent('false');
        expect(screen.getByTestId('is-user')).toHaveTextContent('true');
        expect(screen.getByTestId('is-public')).toHaveTextContent('false');
    });
    it('allows the user to check if the user is a public user', async () => {
        window.localStorage.removeItem('authentication');

        const MockConsumer = () => {
            const { isEditor, isUser, isPublic } = useAuth();
            return (
                <>
                    <div data-testid="is-editor">{isEditor() ? 'true' : 'false'}</div>
                    <div data-testid="is-user">{isUser() ? 'true' : 'false'}</div>
                    <div data-testid="is-public">{isPublic() ? 'true' : 'false'}</div>
                </>
            )
        };

        render(<AuthProvider><MockConsumer /></AuthProvider>);

        expect(screen.getByTestId('is-editor')).toHaveTextContent('false');
        expect(screen.getByTestId('is-user')).toHaveTextContent('false');
        expect(screen.getByTestId('is-public')).toHaveTextContent('true');
    });
    it('does not use auth from localStorage if it is expired', () => {
        window.localStorage.setItem('authentication', JSON.stringify({ userType: 'editor', passcode: 'cool passcode', setTime: new Date().getTime() - 4 * 24 * 60 * 60 * 1000 }));

        const MockConsumer = () => {
            const { auth } = useAuth();
            return (
                <div data-testid="user-type">{auth?.userType || 'none'}</div>
            )
        };

        render(<AuthProvider><MockConsumer /></AuthProvider>);

        expect(screen.getByTestId('user-type')).toHaveTextContent('none');
    })
});