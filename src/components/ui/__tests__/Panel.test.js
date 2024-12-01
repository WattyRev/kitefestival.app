import { render, screen } from '@testing-library/react';
import Panel from '../Panel';

describe('Panel', () => {
    it('renders a div', () => {
        render(<Panel data-testid="target" />);
        expect(screen.getByTestId('target')).toHaveRole('generic');
    });
});