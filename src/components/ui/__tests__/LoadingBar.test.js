import { render, screen } from "@testing-library/react";
import LoadingBar from "../LoadingBar";

describe("LoadingBar", () => {
    it("renders a div", () => {
        render(<LoadingBar data-testid="target" />);
        expect(screen.getByTestId("target")).toHaveRole("generic");
    });
    it('sets data-state to "loading" when loading', () => {
        render(<LoadingBar data-testid="target" isLoading />);
        expect(screen.getByTestId("target")).toHaveAttribute(
            "data-state",
            "loading",
        );
    });
});
