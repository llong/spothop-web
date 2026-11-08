import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MediaCarousel } from '@/routes/spots/-components/MediaCarousel';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const mockMedia = [
  {
    id: 'm1',
    url: 'https://example.com/photo1.jpg',
    type: 'photo' as const,
    author: { id: 'u1', username: 'user1', avatarUrl: null },
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    isLiked: false
  },
  {
    id: 'm2',
    url: 'https://example.com/video1.mp4',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    type: 'video' as const,
    author: { id: 'u1', username: 'user1', avatarUrl: null },
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    isLiked: false
  }
];

describe('MediaCarousel', () => {
  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props: any) => {
    return render(
      <ThemeProvider theme={theme}>
        <MediaCarousel {...props} />
      </ThemeProvider>
    );
  };

  it('renders "No media available" when media list is empty', () => {
    renderComponent({ media: [], activeSlide: 0, onSlideChange: vi.fn() });
    expect(screen.getByText(/No media available/i)).toBeInTheDocument();
  });

  it('renders a photo correctly', () => {
    renderComponent({ media: [mockMedia[0]], activeSlide: 0, onSlideChange: vi.fn() });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockMedia[0].url);
  });

  it('renders a video thumbnail with play button initially', () => {
    renderComponent({ media: [mockMedia[1]], activeSlide: 0, onSlideChange: vi.fn() });
    expect(screen.getByText(/Show Video/i)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockMedia[1].thumbnailUrl);
  });

  it('calls onShowVideo when "Show Video" is clicked', () => {
    const onShowVideo = vi.fn();
    renderComponent({ media: [mockMedia[1]], activeSlide: 0, onSlideChange: vi.fn(), onShowVideo });
    fireEvent.click(screen.getByText(/Show Video/i));
    expect(onShowVideo).toHaveBeenCalled();
  });

  it('renders video player when showVideo is true', () => {
    renderComponent({ media: [mockMedia[1]], activeSlide: 0, onSlideChange: vi.fn(), showVideo: true });
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', mockMedia[1].url);
  });

  it('calls onSlideChange when next button is clicked', () => {
    const onSlideChange = vi.fn();
    renderComponent({ media: mockMedia, activeSlide: 0, onSlideChange });
    
    const nextButton = screen.getByTestId('KeyboardArrowRightIcon').parentElement;
    fireEvent.click(nextButton!);
    
    expect(onSlideChange).toHaveBeenCalledWith(1);
  });

  it('calls onSlideChange when back button is clicked', () => {
    const onSlideChange = vi.fn();
    renderComponent({ media: mockMedia, activeSlide: 1, onSlideChange });
    
    const backButton = screen.getByTestId('KeyboardArrowLeftIcon').parentElement;
    fireEvent.click(backButton!);
    
    expect(onSlideChange).toHaveBeenCalledWith(0);
  });

  it('calls onItemClick when photo is clicked', () => {
    const onItemClick = vi.fn();
    renderComponent({ media: [mockMedia[0]], activeSlide: 0, onSlideChange: vi.fn(), onItemClick });
    
    fireEvent.click(screen.getByRole('img'));
    expect(onItemClick).toHaveBeenCalledWith(0);
  });

  describe('swiping', () => {
    const swipe = (from: number, to: number) => {
      const area = screen.getByAltText('Spot media').parentElement!;
      fireEvent.touchStart(area, { touches: [{ clientX: from }] });
      fireEvent.touchEnd(area, { changedTouches: [{ clientX: to }] });
    };

    it('goes to the next slide on a swipe left', () => {
      const onSlideChange = vi.fn();
      renderComponent({ media: mockMedia, activeSlide: 0, onSlideChange });
      swipe(300, 100);
      expect(onSlideChange).toHaveBeenCalledWith(1);
    });

    it('goes to the previous slide on a swipe right (wrapping around)', () => {
      const onSlideChange = vi.fn();
      renderComponent({ media: mockMedia, activeSlide: 0, onSlideChange });
      swipe(100, 300);
      expect(onSlideChange).toHaveBeenCalledWith(1);
    });

    it('ignores small movements (taps)', () => {
      const onSlideChange = vi.fn();
      renderComponent({ media: mockMedia, activeSlide: 0, onSlideChange });
      swipe(200, 220);
      expect(onSlideChange).not.toHaveBeenCalled();
    });

    it('does nothing with a single item', () => {
      const onSlideChange = vi.fn();
      renderComponent({ media: [mockMedia[0]], activeSlide: 0, onSlideChange });
      swipe(300, 100);
      expect(onSlideChange).not.toHaveBeenCalled();
    });
  });

  describe('dots', () => {
    it('shows one dot per item and marks the active one', () => {
      renderComponent({ media: mockMedia, activeSlide: 1, onSlideChange: vi.fn() });
      const dots = screen.getAllByRole('button', { name: /Go to item/ });
      expect(dots).toHaveLength(2);
      expect(dots[1]).toHaveAttribute('aria-current', 'true');
      expect(dots[0]).toHaveAttribute('aria-current', 'false');
    });

    it('goes to an item when its dot is clicked', () => {
      const onSlideChange = vi.fn();
      renderComponent({ media: mockMedia, activeSlide: 0, onSlideChange });
      fireEvent.click(screen.getByRole('button', { name: 'Go to item 2 of 2' }));
      expect(onSlideChange).toHaveBeenCalledWith(1);
    });

    it('has no dots or arrows for a single item', () => {
      renderComponent({ media: [mockMedia[0]], activeSlide: 0, onSlideChange: vi.fn() });
      expect(screen.queryByRole('button', { name: /Go to item/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    });

    it('keeps labelled arrows for mouse and keyboard users', () => {
      const onSlideChange = vi.fn();
      renderComponent({ media: mockMedia, activeSlide: 0, onSlideChange });
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(onSlideChange).toHaveBeenCalledWith(1);
    });
  });
});
