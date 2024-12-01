import { render, screen } from "@testing-library/react";
import Button from "../Button";

describe('Button', () => {
    it('renders a button with the provided class', () => {
        render(<Button className="danger" data-testid="target">Boogers</Button>);
        expect(screen.getByTestId('target')).toHaveClass('danger');
        expect(screen.getByTestId('target')).toHaveRole('button');
    })
});