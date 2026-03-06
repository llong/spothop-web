import { render, screen, fireEvent } from '@testing-library/react';
import { ContestEntryCard } from '../ContestEntryCard';
import { vi, describe, it, expect } from 'vitest';

describe('ContestEntryCard', () => {
    const mockEntry = {
        id: 'entry-1',
        media_type: 'image',
        media_url: 'image.jpg',
        user_id: 'user-1',
        author: { username: 'user1', avatarUrl: 'avatar.jpg' },
        spot: { name: 'Spot 1' },
        vote_count: 5,
    };
    const mockProps = {
        entry: mockEntry,
        isAdmin: false,
        currentUserId: 'user-2',
        contestStatus: 'active',
        isJudge: false,
        votingType: 'public',
        hasVoted: false,
        onVote: vi.fn(),
        onRetract: vi.fn(),
        onDisqualify: vi.fn(),
        isVoting: false,
    };

    it('renders entry details', () => {
        const { container } = render(<ContestEntryCard {...mockProps} />);

        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('Spot 1')).toBeInTheDocument();
        expect(screen.getByText('5 votes')).toBeInTheDocument();
        
        // Use container query selector to be more specific if role queries are ambiguous
        const mediaImg = container.querySelector('img[src="image.jpg"]');
        expect(mediaImg).toBeInTheDocument();
    });

    it('renders video entry', () => {
        const videoEntry = { ...mockEntry, media_type: 'video', media_url: 'video.mp4' };
        const { container } = render(<ContestEntryCard {...mockProps} entry={videoEntry} />);

        const video = container.querySelector('video');
        expect(video).toBeInTheDocument();
        expect(video).toHaveAttribute('src', 'video.mp4');
    });

    it('shows vote button when allowed', () => {
        render(<ContestEntryCard {...mockProps} contestStatus="voting" />);
        
        expect(screen.getByText('Vote')).toBeInTheDocument();
    });

    it('shows voted state', () => {
        render(<ContestEntryCard {...mockProps} contestStatus="voting" hasVoted={true} />);
        
        expect(screen.getByText('Voted')).toBeInTheDocument();
    });

    it('calls onVote when clicked', () => {
        render(<ContestEntryCard {...mockProps} contestStatus="voting" />);
        
        fireEvent.click(screen.getByText('Vote'));
        expect(mockProps.onVote).toHaveBeenCalledWith({ entryId: 'entry-1', hasVoted: false });
    });

    it('shows retract button for own entry', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(<ContestEntryCard {...mockProps} currentUserId="user-1" />); // Author matches current user
        
        const retractButton = screen.getByText('Remove Entry');
        expect(retractButton).toBeInTheDocument();

        fireEvent.click(retractButton);
        expect(mockProps.onRetract).toHaveBeenCalledWith('entry-1');
    });

    it('shows disqualify button for admin', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(<ContestEntryCard {...mockProps} isAdmin={true} />);
        
        const removeButton = screen.getByText('Remove Entry');
        expect(removeButton).toBeInTheDocument();

        fireEvent.click(removeButton);
        expect(mockProps.onDisqualify).toHaveBeenCalledWith('entry-1');
    });
});
