import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAlert } from "../../../ui/Alert";
import { useAuth } from "../../Auth";
import { usePrompt } from "../../../ui/Prompt";
import fetch from '../../../../util/fetch';
import AuthSelection from "../AuthSelection";

jest.mock("../../../ui/Alert");
jest.mock("../../../ui/Prompt");
jest.mock("../../Auth");
jest.mock("../../../../util/fetch");

describe('AuthSelection', () => {
    let mockOpenPrompt;
    let mockSetAuthentication;
    let mockOpenAlert;
    beforeEach(() => {
        mockOpenPrompt = jest.fn().mockResolvedValue('cool passcode');
        usePrompt.mockReturnValue({
            openPrompt: mockOpenPrompt
        });
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

            expect(mockSetAuthentication).toHaveBeenCalledWith({ userType: 'editor', passcode: 'cool passcode' });
        });
        it('shows an error alert if log in is unsuccessful', async () => {
            fetch.mockResolvedValue({
                ok: false,
            })

            render(<AuthSelection />);

            await userEvent.click(screen.getByTestId('log-in'));

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