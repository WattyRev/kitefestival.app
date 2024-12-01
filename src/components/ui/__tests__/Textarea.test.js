import { render, screen } from "@testing-library/react";
import Textarea from "../Textarea";

describe('Textarea', () => {
    it('renders a textarea', () => {
        render(<Textarea data-testid="target" />);
        expect(screen.getByTestId('target')).toHaveRole('textbox');
    })
});