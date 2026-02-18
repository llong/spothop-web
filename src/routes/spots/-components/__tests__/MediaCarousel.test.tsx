import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MediaCarousel } from '../MediaCarousel';
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

  it('switches to video player when "Show Video" is clicked', () => {
    renderComponent({ media: [mockMedia[1]], activeSlide: 0, onSlideChange: vi.fn() });
    fireEvent.click(screen.getByText(/Show Video/i));
    // The video element doesn't have a role, but we can find it by tag
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
});
