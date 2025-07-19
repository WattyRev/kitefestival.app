import { render, screen } from "@testing-library/react";
import FileInput from "../FileInput";

describe("FileInput", () => {
    it("renders", () => {
        render(<FileInput data-testid="target" />);
        expect(screen.getByTestId("target")).toBeInTheDocument();
    });
});
