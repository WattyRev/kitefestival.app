import { render, screen } from "@testing-library/react";
import H2 from "../H2";

describe("H2", () => {
    it("renders a h2", () => {
        render(<H2 data-testid="target">Boogers</H2>);
        expect(screen.getByTestId("target")).toHaveRole("heading");
    });
});
