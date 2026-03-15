import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSetMode = vi.fn();
let currentMode = 'light';

vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtom: vi.fn(() => [currentMode, mockSetMode]),
    };
});

describe('ThemeToggle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentMode = 'light';
    });

    it('renders and toggles mode on click', () => {
        render(<ThemeToggle />);
        const button = screen.getByRole('button');
        
        // Mode is strictly 'light', click should set `dark`
        fireEvent.click(button);
        expect(mockSetMode).toHaveBeenCalledWith('dark');
    });

    it('shows label when showLabel prop is true', () => {
        render(<ThemeToggle showLabel={true} />);
        expect(screen.getByText('Light Mode')).toBeInTheDocument();
    });

    it('hides label when showLabel prop is false', () => {
        render(<ThemeToggle showLabel={false} />);
        expect(screen.queryByText('Light Mode')).not.toBeInTheDocument();
        expect(screen.queryByText('Dark Mode')).not.toBeInTheDocument();
    });

    it('displays Dark Mode label correctly', () => {
        currentMode = 'dark';
        render(<ThemeToggle showLabel={true} />);
        expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });
});
