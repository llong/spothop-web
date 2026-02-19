import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SpotStats } from '../SpotStats';

describe('SpotStats', () => {
    it('renders all stats when provided', () => {
        render(<SpotStats difficulty="advanced" kickoutRisk={3} isLit={true} />);
        
        expect(screen.getByText('Advanced')).toBeInTheDocument();
        expect(screen.getByText('3/10')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('Difficulty')).toBeInTheDocument();
        expect(screen.getByText('Kickout Risk')).toBeInTheDocument();
        expect(screen.getByText('Lit at Night')).toBeInTheDocument();
    });

    it('renders partially provided stats', () => {
        render(<SpotStats difficulty="beginner" />);
        
        expect(screen.getByText('Beginner')).toBeInTheDocument();
        expect(screen.queryByText('Kickout Risk')).not.toBeInTheDocument();
        expect(screen.queryByText('Lit at Night')).not.toBeInTheDocument();
    });

    it('renders No for isLit=false', () => {
        render(<SpotStats isLit={false} />);
        expect(screen.getByText('No')).toBeInTheDocument();
    });
});
