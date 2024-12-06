import { render, screen } from "@testing-library/react";
import { useAuth } from "../global/Auth";
import Comment from "../Comments/Comment";
import Comments from "../Comments";
import userEvent from "@testing-library/user-event";

jest.mock('../global/Auth');
jest.mock('../Comments/Comment');

describe('components/Comments', () => {
    let mockProps;
    beforeEach(() => {
        mockProps = {
            comments: [],
            onCreate: jest.fn(),
            onDelete: jest.fn(),
            onEdit: jest.fn()
        }
        useAuth.mockReturnValue({
            isPublic: jest.fn().mockReturnValue(false)
        })
        Comment.mockReturnValue(<div data-testid="comment" />);
    })
    it('should render a button to toggle comment display', async () => {
        render(<Comments {...mockProps} />)
        expect(screen.getByTestId('toggle-comments')).toHaveTextContent('Comments (0)');
    });
    it('should render nothing if the user is a member of the public', async () => {
        useAuth.mockReturnValue({
            isPublic: jest.fn().mockReturnValue(true)
        })
        render(<Comments {...mockProps} />)
        expect(screen.queryByTestId('toggle-comments')).not.toBeInTheDocument();
    });
    it('should render No Comments if there are no comments', async () => {
        render(<Comments {...mockProps} />)

        await userEvent.click(screen.getByTestId('toggle-comments'));
        expect(screen.getByTestId('no-comments')).toHaveTextContent('No Comments');
    });
    it('should render a Comment for each comment', async () => {
        mockProps.comments = [
            {
                id: 1,
                message: 'boogers',
            }
        ]
        render(<Comments {...mockProps} />);

        await userEvent.click(screen.getByTestId('toggle-comments'));
        expect(screen.getByTestId('comment')).toBeInTheDocument();
    });
});