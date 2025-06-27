import { render, screen } from "@testing-library/react";
import AuthSelection from "../TopNav/AuthSelection";
import TopNav from "../TopNav";

jest.mock("../TopNav/AuthSelection");

describe("TopNav", () => {
    beforeEach(() => {
        AuthSelection.mockReturnValue(<div data-testid="auth-selection" />);
    });
    it("renders", () => {
        render(<TopNav />);

        expect(screen.getByTestId("top-nav")).toBeInTheDocument();
    });
});
