import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAlert } from "../../../ui/Alert";
import { useAuth } from "../../Auth";
import AuthSelection from "../AuthSelection";
import { usePrompt } from "../../../ui/Prompt";
import { validatePasscode } from "../../../../app/api/passcodes";

jest.mock("../../../ui/Alert");
jest.mock("../../Auth");
jest.mock("../../../ui/Prompt");
jest.mock("../../../../app/api/passcodes");

describe("AuthSelection", () => {
    let mockSetAuthentication;
    let mockOpenAlert;
    beforeEach(() => {
        validatePasscode.mockResolvedValue({ userType: "editor" });
        mockSetAuthentication = jest.fn();
        useAuth.mockReturnValue({
            setAuthentication: mockSetAuthentication,
            auth: {
                userType: null,
            },
        });
        mockOpenAlert = jest.fn();
        useAlert.mockReturnValue({
            openAlert: mockOpenAlert,
        });
        usePrompt.mockReturnValue({
            openPrompt: jest.fn().mockResolvedValue(),
        });
    });
    describe("when logged out", () => {
        it("allows the user to log in", async () => {
            render(<AuthSelection />);

            await userEvent.click(screen.getByTestId("log-in"));
            await userEvent.type(screen.getByTestId("name-input"), "Cool guy");
            await userEvent.type(
                screen.getByTestId("passcode-input"),
                "cool passcode",
            );
            await userEvent.click(screen.getByTestId("submit-log-in"));

            expect(validatePasscode).toHaveBeenCalledWith(
                "cool passcode",
                "Cool guy",
            );
            expect(mockSetAuthentication).toHaveBeenCalledWith({
                userType: "editor",
                passcode: "cool passcode",
            });
        });
        it("shows an error alert if log in is unsuccessful", async () => {
            validatePasscode.mockRejectedValue(new Error("Invalid passcode"));

            render(<AuthSelection />);

            await userEvent.click(screen.getByTestId("log-in"));
            await userEvent.type(screen.getByTestId("name-input"), "Cool guy");
            await userEvent.type(
                screen.getByTestId("passcode-input"),
                "cool passcode",
            );
            await userEvent.click(screen.getByTestId("submit-log-in"));

            expect(mockOpenAlert).toHaveBeenCalledWith(
                "Invalid passcode",
                "error",
            );
            expect(mockSetAuthentication).not.toHaveBeenCalled();
        });
    });
    describe("when logged in", () => {
        it("allows the user to log out", async () => {
            let mockClearAuth = jest.fn();
            useAuth.mockReturnValue({
                setAuthentication: mockSetAuthentication,
                auth: {
                    userType: "editor",
                },
                clearAuthentication: mockClearAuth,
            });

            render(<AuthSelection />);

            await userEvent.click(screen.getByTestId("log-out"));
            expect(mockClearAuth).toHaveBeenCalled();
        });
        it("does not log the user out if they decline to confirm", async () => {
            usePrompt.mockReturnValue({
                openPrompt: jest.fn().mockRejectedValue(),
            });
            let mockClearAuth = jest.fn();
            useAuth.mockReturnValue({
                setAuthentication: mockSetAuthentication,
                auth: {
                    userType: "editor",
                },
                clearAuthentication: mockClearAuth,
            });

            render(<AuthSelection />);

            await userEvent.click(screen.getByTestId("log-out"));
            expect(mockClearAuth).not.toHaveBeenCalled();
        });
    });
});
