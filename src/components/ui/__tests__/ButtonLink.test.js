import { screen, render } from '@testing-library/react';
import ButtonLink from '../ButtonLink';

describe('ButtonLink', () => {
    it('renders a button with the provided class', () => {
        render(<ButtonLink href="#" className="danger" data-testid="target">Boogers</ButtonLink>);
        expect(screen.getByTestId('target')).toHaveClass('danger');
        expect(screen.getByTestId('target')).toHaveRole('link');
    })
});