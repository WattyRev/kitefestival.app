import { render, screen } from '@testing-library/react';
// import Date from '../../../util/Date';
import TimeAgo from '../TimeAgo';

// jest.mock('../../../util/Date');

describe('components/ui/TimeAgo', () => {
    it('renders "0 seconds ago"', () => {
        render(<TimeAgo timestamp={new Date()} />);
        expect(screen.getByText('0 seconds ago')).toBeInTheDocument();
    });
    it('renders "1 second ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - 1000} />);
        expect(screen.getByText('1 second ago')).toBeInTheDocument();
    });
    it('renders "2 seconds ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - 2000} />);
        expect(screen.getByText('2 seconds ago')).toBeInTheDocument();
    });
    it('renders "1 minute ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61)} />);
        expect(screen.getByText('1 minute ago')).toBeInTheDocument();
    });
    it('renders "2 minutes ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61 * 2)} />);
        expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
    });
    it('renders "1 hour ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61 * 60)} />);
        expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    });
    it('renders "2 hours ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61 * 60 * 2)} />);
        expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });
    it('renders "1 day ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61 * 60 * 24)} />);
        expect(screen.getByText('1 day ago')).toBeInTheDocument();
    });
    it('renders "2 days ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61 * 60 * 24 * 2)} />);
        expect(screen.getByText('2 days ago')).toBeInTheDocument();
    });
    it('renders "1 month ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61 * 60 * 24 * 31)} />);
        expect(screen.getByText('1 month ago')).toBeInTheDocument();
    });
    it('renders "2 months ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61 * 60 * 24 * 31 * 2)} />);
        expect(screen.getByText('2 months ago')).toBeInTheDocument();
    });
    it('renders "1 year ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61 * 60 * 24 * 31 * 12)} />);
        expect(screen.getByText('1 year ago')).toBeInTheDocument();
    });
    it('renders "2 years ago"', () => {
        render(<TimeAgo timestamp={new Date().getTime() - (1000 * 61 * 60 * 24 * 31 * 12 * 2)} />);
        expect(screen.getByText('2 years ago')).toBeInTheDocument();
    });
});