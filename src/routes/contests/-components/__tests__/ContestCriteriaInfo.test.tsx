import { render, screen } from '@testing-library/react';
import { ContestCriteriaInfo } from '../ContestCriteriaInfo';
import { describe, it, expect } from 'vitest';

describe('ContestCriteriaInfo', () => {
    const mockContest = {
        prize_info: 'Win $100',
        end_date: new Date('2026-01-01').toISOString(),
        criteria: {
            allowed_rider_types: ['skater', 'biker'],
            required_media_types: ['video'],
            allowed_spot_types: ['skate_park', 'street_spot'],
            allowed_difficulties: ['advanced', 'expert'],
            allowed_is_lit: true,
            allowed_kickout_risk_max: 5,
            location_radius_km: 16.0934, // 10 miles
            location_latitude: 34.0522,
            location_longitude: -118.2437,
            specific_spot_id: 'spot-123',
            require_spot_creator_is_competitor: true,
            spot_creation_time_frame: 'last_30_days',
        },
    } as any;

    it('renders all criteria information', () => {
        render(<ContestCriteriaInfo contest={mockContest} />);

        // Prize
        expect(screen.getByText('Prizes')).toBeInTheDocument();
        expect(screen.getByText('Win $100')).toBeInTheDocument();

        // Deadline
        expect(screen.getByText(/Deadline:/)).toBeInTheDocument();
        expect(screen.getByText(/1\/1\/2026/)).toBeInTheDocument(); // Assuming US locale or similar date format

        // Open To
        expect(screen.getByText(/Open To:/)).toBeInTheDocument();
        expect(screen.getByText(/skater, biker/i)).toBeInTheDocument();

        // Format
        expect(screen.getByText(/Format:/)).toBeInTheDocument();
        expect(screen.getByText(/video/i)).toBeInTheDocument();

        // Spots
        expect(screen.getByText(/Spots:/)).toBeInTheDocument();
        expect(screen.getByText(/skate park, street spot/i)).toBeInTheDocument();

        // Difficulty
        expect(screen.getByText(/Difficulty:/)).toBeInTheDocument();
        expect(screen.getByText(/advanced, expert/i)).toBeInTheDocument();

        // Lighting
        expect(screen.getByText(/Lighting:/)).toBeInTheDocument();
        expect(screen.getByText('Spot must be lit')).toBeInTheDocument();

        // Max Risk
        expect(screen.getByText(/Max Risk:/)).toBeInTheDocument();
        expect(screen.getByText('5/10')).toBeInTheDocument();

        // Location (Radius)
        expect(screen.getAllByText(/Location:/)[0]).toBeInTheDocument();
        expect(screen.getByText(/Within 10.0 miles of center/)).toBeInTheDocument();

        // Specific spot
        expect(screen.getAllByText(/Location:/)[1]).toBeInTheDocument();
        expect(screen.getByText('Specific spot required')).toBeInTheDocument();

        // Creator
        expect(screen.getByText(/Creator:/)).toBeInTheDocument();
        expect(screen.getByText('Must be spot creator')).toBeInTheDocument();

        // Spot Age
        expect(screen.getByText(/Spot Age:/)).toBeInTheDocument();
        expect(screen.getByText(/Created last 30 days/i)).toBeInTheDocument();
    });

    it('handles minimal criteria', () => {
        const minimalContest = {
            prize_info: null,
            end_date: new Date().toISOString(),
            criteria: {},
        } as any;

        render(<ContestCriteriaInfo contest={minimalContest} />);

        expect(screen.getByText('To be announced!')).toBeInTheDocument();
        expect(screen.getByText('All Riders')).toBeInTheDocument();
    });
});
