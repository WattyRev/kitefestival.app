import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAlert } from "../../../ui/Alert";
import { useAuth } from "../../Auth";
import fetch from '../../../../util/fetch';
import AuthSelection from "../AuthSelection";

jest.mock("../../../ui/Alert");
jest.mock("../../Auth");
jest.mock("../../../../util/fetch");

describe('AuthSelection', () => {
    let mockSetAuthentication;
    let mockOpenAlert;
    beforeEach(() => {
        fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ userType: 'editor' })
        })
        mockSetAuthentication = jest.fn();
        useAuth.mockReturnValue({
            setAuthentication: mockSetAuthentication,
            auth: {
                userType: null
            }
        });
        mockOpenAlert = jest.fn();
        useAlert.mockReturnValue({
            openAlert: mockOpenAlert
        });
    });
    describe('when logged out', () => {
        it('allows the user to log in', async () => {
            render(<AuthSelection />);

            await userEvent.click(screen.getByTestId('log-in'));
            await userEvent.type(screen.getByTestId('name-input'), 'Cool guy');
            await userEvent.type(screen.getByTestId('passcode-input'), 'cool passcode');
            await userEvent.click(screen.getByTestId('submit-log-in'));

            expect(fetch).toHaveBeenCalledWith('/api/passcodes', {
                method: 'POST',
                body: JSON.stringify({
                    passcode: 'cool passcode',
                    name: 'Cool guy'
                })
            });
            expect(mockSetAuthentication).toHaveBeenCalledWith({ userType: 'editor', passcode: 'cool passcode' });
        });
        it('shows an error alert if log in is unsuccessful', async () => {
            fetch.mockResolvedValue({
                ok: false,
            })

            render(<AuthSelection />);

            await userEvent.click(screen.getByTestId('log-in'));
            await userEvent.type(screen.getByTestId('name-input'), 'Cool guy');
            await userEvent.type(screen.getByTestId('passcode-input'), 'cool passcode');
            await userEvent.click(screen.getByTestId('submit-log-in'));

            expect(mockOpenAlert).toHaveBeenCalledWith('Invalid passcode', 'error');
            expect(mockSetAuthentication).not.toHaveBeenCalled();
        });
    });
    describe('when logged in', () => {
        it('allows the user to log out', async () => {
            let mockClearAuth = jest.fn();
            useAuth.mockReturnValue({
                setAuthentication: mockSetAuthentication,
                auth: {
                    userType: 'editor',
                },
                clearAuthentication: mockClearAuth
            });

            render(<AuthSelection />);

            await userEvent.click(screen.getByTestId('log-out'));
            expect(mockClearAuth).toHaveBeenCalled();
        });
    });
});