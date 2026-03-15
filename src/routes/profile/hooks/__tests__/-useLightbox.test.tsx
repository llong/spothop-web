import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLightbox } from '../-useLightbox';

describe('useLightbox', () => {
    const mockMediaItems: any[] = [
        { id: '1', url: 'test1.jpg' },
        { id: '2', url: 'test2.jpg' },
        { id: '3', url: 'test3.jpg' }
    ];

    it('should initialize correctly', () => {
        const { result } = renderHook(() => useLightbox(mockMediaItems));
        
        expect(result.current.lightboxIndex).toBeNull();
        expect(result.current.currentMedia).toBeNull();
    });

    it('should open lightbox', () => {
        const { result } = renderHook(() => useLightbox(mockMediaItems));
        
        act(() => {
            result.current.openLightbox(1);
        });
        
        expect(result.current.lightboxIndex).toBe(1);
        expect(result.current.currentMedia).toEqual(mockMediaItems[1]);
    });

    it('should close lightbox', () => {
        const { result } = renderHook(() => useLightbox(mockMediaItems));
        
        act(() => {
            result.current.openLightbox(1);
        });
        
        act(() => {
            result.current.closeLightbox();
        });
        
        expect(result.current.lightboxIndex).toBeNull();
        expect(result.current.currentMedia).toBeNull();
    });

    it('should navigate to next media', () => {
        const { result } = renderHook(() => useLightbox(mockMediaItems));
        
        act(() => {
            result.current.openLightbox(1);
        });
        
        act(() => {
            result.current.nextMedia();
        });
        
        expect(result.current.lightboxIndex).toBe(2);
    });

    it('should wrap around to first media when clicking next on last item', () => {
        const { result } = renderHook(() => useLightbox(mockMediaItems));
        
        act(() => {
            result.current.openLightbox(2);
        });
        
        act(() => {
            result.current.nextMedia();
        });
        
        expect(result.current.lightboxIndex).toBe(0);
    });

    it('should navigate to prev media', () => {
        const { result } = renderHook(() => useLightbox(mockMediaItems));
        
        act(() => {
            result.current.openLightbox(1);
        });
        
        act(() => {
            result.current.prevMedia();
        });
        
        expect(result.current.lightboxIndex).toBe(0);
    });

    it('should wrap around to last media when clicking prev on first item', () => {
        const { result } = renderHook(() => useLightbox(mockMediaItems));
        
        act(() => {
            result.current.openLightbox(0);
        });
        
        act(() => {
            result.current.prevMedia();
        });
        
        expect(result.current.lightboxIndex).toBe(2);
    });

    it('should handle keyboard events', () => {
        const { result } = renderHook(() => useLightbox(mockMediaItems));
        
        act(() => {
            result.current.openLightbox(1);
        });
        
        // Test ArrowRight
        act(() => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            window.dispatchEvent(event);
        });
        expect(result.current.lightboxIndex).toBe(2);
        
        // Test ArrowLeft
        act(() => {
            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            window.dispatchEvent(event);
        });
        expect(result.current.lightboxIndex).toBe(1);
        
        // Test Escape
        act(() => {
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            window.dispatchEvent(event);
        });
        expect(result.current.lightboxIndex).toBeNull();
    });
});
