import { render, screen } from '@testing-library/react';
import H1 from '../H1';

describe('H1', () => {
    it('renders a h1', () => {
        render(<H1 className="danger" data-testid="target">Boogers</H1>);
        expect(screen.getByTestId('target')).toHaveRole('heading');
    })
});