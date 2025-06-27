import { render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "../Auth";
import userEvent from "@testing-library/user-event";

describe("Auth", () => {
    it("provides auth information based cookies", async () => {
        document.cookie = "userType=editor;";
        document.cookie = "userId=a;";
        document.cookie = `userName=${encodeURIComponent("cool guy")};`;
        const MockConsumer = () => {
            const { auth } = useAuth();
            return (
                <>
                    <div data-testid="user-type">{auth.userType}</div>
                    <div data-testid="user-id">{auth.userId}</div>
                    <div data-testid="user-name">{auth.userName}</div>
                </>
            );
        };

        render(
            <AuthProvider>
                <MockConsumer />
            </AuthProvider>,
        );

        expect(screen.getByTestId("user-type")).toHaveTextContent("editor");
        expect(screen.getByTestId("user-id")).toHaveTextContent("a");
        expect(screen.getByTestId("user-name")).toHaveTextContent("cool guy");
    });
    it("allows the user to update the authentication state based on cookies", async () => {
        document.cookie = "userType=editor;";
        document.cookie = "userId=a;";
        document.cookie = `userName=${encodeURIComponent("cool guy")};`;
        const MockConsumer = () => {
            const { auth, setAuthentication } = useAuth();
            return (
                <>
                    <button
                        data-testid="set"
                        onClick={() => {
                            document.cookie = "userType=user;";
                            document.cookie = "userId=b;";
                            document.cookie = `userName=${encodeURIComponent("cooler guy")};`;
                            setAuthentication();
                        }}
                    >
                        Set
                    </button>
                    <div data-testid="user-type">{auth.userType}</div>
                    <div data-testid="user-id">{auth.userId}</div>
                    <div data-testid="user-name">{auth.userName}</div>
                </>
            );
        };

        render(
            <AuthProvider>
                <MockConsumer />
            </AuthProvider>,
        );

        await userEvent.click(screen.getByTestId("set"));

        expect(screen.getByTestId("user-type")).toHaveTextContent("user");
        expect(screen.getByTestId("user-id")).toHaveTextContent("b");
        expect(screen.getByTestId("user-name")).toHaveTextContent("cooler guy");
    });
    it("allows the user to clear the authentication", async () => {
        document.cookie = "userType=editor;";
        document.cookie = "userId=a;";
        document.cookie = `userName=${encodeURIComponent("cool guy")};`;
        document.cookie = `passcode=${encodeURIComponent("cool passcode")};`;
        const MockConsumer = () => {
            const { clearAuthentication } = useAuth();
            return (
                <>
                    <button data-testid="clear" onClick={clearAuthentication}>
                        Clear
                    </button>
                </>
            );
        };

        render(
            <AuthProvider>
                <MockConsumer />
            </AuthProvider>,
        );
        await userEvent.click(screen.getByTestId("clear"));

        // does not clear user id
        expect(document.cookie).toContain("userId=a");

        // does not clear user name
        expect(document.cookie).toContain(
            `userName=${encodeURIComponent("cool guy")}`,
        );

        // clears user-type
        expect(document.cookie).not.toContain("userType");

        // removes password cookie
        expect(document.cookie).not.toContain("passcode");
    });
    it("allows the user to check if the user is an editor", async () => {
        document.cookie = "userType=editor;";

        const MockConsumer = () => {
            const { isEditor, isUser, isPublic } = useAuth();
            return (
                <>
                    <div data-testid="is-editor">
                        {isEditor() ? "true" : "false"}
                    </div>
                    <div data-testid="is-user">
                        {isUser() ? "true" : "false"}
                    </div>
                    <div data-testid="is-public">
                        {isPublic() ? "true" : "false"}
                    </div>
                </>
            );
        };

        render(
            <AuthProvider>
                <MockConsumer />
            </AuthProvider>,
        );

        expect(screen.getByTestId("is-editor")).toHaveTextContent("true");
        expect(screen.getByTestId("is-user")).toHaveTextContent("false");
        expect(screen.getByTestId("is-public")).toHaveTextContent("false");
    });
    it("allows the user to check if the user is a user", async () => {
        document.cookie = "userType=user;";

        const MockConsumer = () => {
            const { isEditor, isUser, isPublic } = useAuth();
            return (
                <>
                    <div data-testid="is-editor">
                        {isEditor() ? "true" : "false"}
                    </div>
                    <div data-testid="is-user">
                        {isUser() ? "true" : "false"}
                    </div>
                    <div data-testid="is-public">
                        {isPublic() ? "true" : "false"}
                    </div>
                </>
            );
        };

        render(
            <AuthProvider>
                <MockConsumer />
            </AuthProvider>,
        );

        expect(screen.getByTestId("is-editor")).toHaveTextContent("false");
        expect(screen.getByTestId("is-user")).toHaveTextContent("true");
        expect(screen.getByTestId("is-public")).toHaveTextContent("false");
    });
    it("allows the user to check if the user is a public user", async () => {
        document.cookie = "userType=;expires=Thu, 01 Jan 1970 00:00:01 GMT";

        const MockConsumer = () => {
            const { isEditor, isUser, isPublic } = useAuth();
            return (
                <>
                    <div data-testid="is-editor">
                        {isEditor() ? "true" : "false"}
                    </div>
                    <div data-testid="is-user">
                        {isUser() ? "true" : "false"}
                    </div>
                    <div data-testid="is-public">
                        {isPublic() ? "true" : "false"}
                    </div>
                </>
            );
        };

        render(
            <AuthProvider>
                <MockConsumer />
            </AuthProvider>,
        );

        expect(screen.getByTestId("is-editor")).toHaveTextContent("false");
        expect(screen.getByTestId("is-user")).toHaveTextContent("false");
        expect(screen.getByTestId("is-public")).toHaveTextContent("true");
    });
});
