import { render, screen } from '@testing-library/react';
import TextInput from '../TextInput';

describe('TextInput', () => {
    it('renders an input', () => {
        render(<TextInput data-testid="target" />);
        expect(screen.getByTestId('target')).toHaveRole('textbox');
    })
})