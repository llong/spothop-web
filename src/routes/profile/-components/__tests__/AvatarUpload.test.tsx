import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvatarUpload } from '../AvatarUpload';

// Mock dependencies
vi.mock('../../../atoms/auth', () => ({
    userAtom: {
        read: () => ({ user: { id: 'test-user-id' } })
    }
}));

vi.mock('src/utils/imageOptimization', () => ({
    getOptimizedImageUrl: (url: string) => url
}));

describe('AvatarUpload Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders upload component', () => {
        const mockOnUpload = vi.fn();

        render(
            <AvatarUpload
                avatarUrl="https://example.com/current-avatar.jpg"
                onUpload={mockOnUpload}
            />
        );

        expect(screen.getByAltText('User profile picture')).toBeInTheDocument();
        expect(screen.getByLabelText('upload profile picture')).toBeInTheDocument();
    });

    it('opens file selector on click', () => {
        const mockOnUpload = vi.fn();

        render(
            <AvatarUpload
                avatarUrl="https://example.com/current-avatar.jpg"
                onUpload={mockOnUpload}
            />
        );

        const uploadButton = screen.getByLabelText('upload profile picture');
        const fileInput = screen.getByTestId('avatar-file-input'); // We'll add this test ID

        // Mock the click on input
        const clickSpy = vi.spyOn(fileInput, 'click');

        fireEvent.click(uploadButton);

        expect(clickSpy).toHaveBeenCalled();
    });
});
