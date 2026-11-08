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

  describe('scroll-snap track', () => {
    const photos = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ ...mockMedia[0], id: `p${i}`, url: `https://example.com/photo${i}.jpg` }));

    /** jsdom has no layout: give the track a width and capture scrollTo calls. */
    const track = () => {
      const el = screen.getAllByRole('group', { hidden: true })[0].parentElement as HTMLDivElement;
      Object.defineProperty(el, 'clientWidth', { value: 300, configurable: true });
      el.scrollTo = vi.fn() as unknown as typeof el.scrollTo;
      return el;
    };
    const scrollTo = (el: HTMLElement, left: number) => {
      el.scrollLeft = left;
      fireEvent.scroll(el);
    };

    it('reports the slide the user scrolled to', () => {
      const onSlideChange = vi.fn();
      renderComponent({ media: photos(3), activeSlide: 0, onSlideChange });
      scrollTo(track(), 300);
      expect(onSlideChange).toHaveBeenCalledWith(1);
    });

    it('does not report a change until more than half of the next slide is showing', () => {
      const onSlideChange = vi.fn();
      renderComponent({ media: photos(3), activeSlide: 0, onSlideChange });
      scrollTo(track(), 100);
      expect(onSlideChange).not.toHaveBeenCalled();
    });

    it('scrolls the track smoothly when the next slide is chosen from outside (arrow/dot)', () => {
      const { rerender } = renderComponent({ media: photos(3), activeSlide: 0, onSlideChange: vi.fn() });
      const el = track();
      rerender(
        <ThemeProvider theme={theme}>
          <MediaCarousel media={photos(3)} activeSlide={1} onSlideChange={vi.fn()} />
        </ThemeProvider>
      );
      expect(el.scrollTo).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
    });

    it('jumps without animating across several slides', () => {
      const { rerender } = renderComponent({ media: photos(5), activeSlide: 0, onSlideChange: vi.fn() });
      const el = track();
      rerender(
        <ThemeProvider theme={theme}>
          <MediaCarousel media={photos(5)} activeSlide={4} onSlideChange={vi.fn()} />
        </ThemeProvider>
      );
      expect(el.scrollTo).toHaveBeenCalledWith({ left: 1200, behavior: 'auto' });
    });

    it('ignores the in-between scroll positions of a programmatic scroll', () => {
      const onSlideChange = vi.fn();
      const { rerender } = renderComponent({ media: photos(3), activeSlide: 0, onSlideChange });
      const el = track();
      rerender(
        <ThemeProvider theme={theme}>
          <MediaCarousel media={photos(3)} activeSlide={1} onSlideChange={onSlideChange} />
        </ThemeProvider>
      );

      scrollTo(el, 20); // still near slide 0 while the animation runs
      scrollTo(el, 300); // arrived

      expect(onSlideChange).not.toHaveBeenCalled();
    });

    it('only loads the active slide and its neighbours', () => {
      renderComponent({ media: photos(6), activeSlide: 3, onSlideChange: vi.fn() });
      expect(screen.getAllByRole('img', { hidden: true }).map((img) => img.getAttribute('src'))).toEqual([
        'https://example.com/photo2.jpg',
        'https://example.com/photo3.jpg',
        'https://example.com/photo4.jpg',
      ]);
    });

    it('hides the previous arrow on the first slide and the next arrow on the last', () => {
      const { rerender } = renderComponent({ media: photos(3), activeSlide: 0, onSlideChange: vi.fn() });
      expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <MediaCarousel media={photos(3)} activeSlide={2} onSlideChange={vi.fn()} />
        </ThemeProvider>
      );
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    });

    it('makes off-screen slides inert so they cannot be tabbed into', () => {
      renderComponent({ media: photos(2), activeSlide: 0, onSlideChange: vi.fn() });
      const [first, second] = screen.getAllByRole('group', { hidden: true });
      expect(first).not.toHaveAttribute('inert');
      expect(second).toHaveAttribute('inert');
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
