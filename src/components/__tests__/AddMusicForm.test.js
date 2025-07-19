import { render, screen } from "@testing-library/react";
import AddMusicForm from "../AddMusicForm";
import { useMusicLibrary } from "../MusicLibraryContainer";
import userEvent from "@testing-library/user-event";

jest.mock("../MusicLibraryContainer");

describe("AddMusicForm", () => {
    let mockAddMusic;
    beforeEach(() => {
        mockAddMusic = jest.fn().mockResolvedValue();
        useMusicLibrary.mockReturnValue({
            addMusic: mockAddMusic,
        });
    });
    it("renders", async () => {
        render(<AddMusicForm />);

        expect(screen.getByTestId("add-music-form")).toBeInTheDocument();
    });
    it("allows the user to add an individual music entry", async () => {
        render(<AddMusicForm />);

        await userEvent.type(screen.getByTestId("music-input"), "song 1");
        await userEvent.click(screen.getByTestId("add-music-button"));

        expect(mockAddMusic).toHaveBeenCalledWith([{ value: "song 1" }]);
    });
});
