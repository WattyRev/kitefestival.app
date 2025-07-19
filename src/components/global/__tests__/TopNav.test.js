import { render, screen } from "@testing-library/react";
import AuthSelection from "../TopNav/AuthSelection";
import { useAuth } from "../Auth";
import TopNav from "../TopNav";

jest.mock("../TopNav/AuthSelection");
jest.mock("../Auth");

describe("TopNav", () => {
    beforeEach(() => {
        AuthSelection.mockReturnValue(<div data-testid="auth-selection" />);
        useAuth.mockReturnValue({
            isPublic: () => false,
        });
    });
    it("renders", () => {
        render(<TopNav />);

        expect(screen.getByTestId("top-nav")).toBeInTheDocument();
    });
    it("renders the Music Library link for non-public users", async () => {
        useAuth.mockReturnValue({
            isPublic: () => false,
        });

        render(<TopNav />);
        expect(screen.queryByTitle("Music Library")).toBeInTheDocument();
    });
    it("does not render the Music Library Link for public users", async () => {
        useAuth.mockReturnValue({
            isPublic: () => true,
        });

        render(<TopNav />);
        expect(screen.queryByTitle("Music Library")).not.toBeInTheDocument();
    });
});
