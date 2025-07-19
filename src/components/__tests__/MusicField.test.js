import { render, screen } from "@testing-library/react";
import MusicField from "../MusicField";

describe("MusicField", () => {
    it("renders", async () => {
        render(<MusicField data-testid="target" />);

        const musicField = screen.getByTestId("target");
        expect(musicField).toBeInTheDocument();
    });
});
