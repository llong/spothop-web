import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { DetailsMediaSection } from '../DetailsMediaSection';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const mockSpot = {
  id: 's1',
  name: 'Test Spot',
  media: [
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
  ],
  videoLinks: []
} as any;

// Mock MediaListItem and ProPartsTab to avoid deep rendering issues
vi.mock('../MediaListItem', () => ({
  MediaListItem: ({ item, onClick }: any) => (
    <div data-testid={`media-item-${item.id}`} onClick={onClick}>
      {item.type}
    </div>
  )
}));

vi.mock('../ProParts/ProPartsTab', () => ({
  ProPartsTab: () => <div data-testid="pro-parts-tab">Pro Parts</div>
}));

describe('DetailsMediaSection', () => {
  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props: any) => {
    return render(
      <ThemeProvider theme={theme}>
        <DetailsMediaSection {...props} />
      </ThemeProvider>
    );
  };

  it('renders photos by default', () => {
    renderComponent({ 
      spot: mockSpot, 
      onLike: vi.fn(), 
      onComment: vi.fn(), 
      onShare: vi.fn(), 
      onItemClick: vi.fn() 
    });
    
    expect(screen.getByTestId('media-item-m1')).toBeInTheDocument();
    expect(screen.queryByTestId('media-item-m2')).not.toBeInTheDocument();
  });

  it('switches to video tab when clicked', () => {
    renderComponent({ 
      spot: mockSpot, 
      onLike: vi.fn(), 
      onComment: vi.fn(), 
      onShare: vi.fn(), 
      onItemClick: vi.fn() 
    });
    
    fireEvent.click(screen.getByText(/Videos/i));
    
    expect(screen.getByTestId('media-item-m2')).toBeInTheDocument();
    expect(screen.queryByTestId('media-item-m1')).not.toBeInTheDocument();
  });

  it('switches to pro history tab when clicked', () => {
    renderComponent({ 
      spot: mockSpot, 
      onLike: vi.fn(), 
      onComment: vi.fn(), 
      onShare: vi.fn(), 
      onItemClick: vi.fn() 
    });
    
    fireEvent.click(screen.getByText(/Pro History/i));
    
    expect(screen.getByTestId('pro-parts-tab')).toBeInTheDocument();
  });

  it('calls onItemClick with correct index', () => {
    const onItemClick = vi.fn();
    renderComponent({ 
      spot: mockSpot, 
      onLike: vi.fn(), 
      onComment: vi.fn(), 
      onShare: vi.fn(), 
      onItemClick 
    });
    
    fireEvent.click(screen.getByTestId('media-item-m1'));
    expect(onItemClick).toHaveBeenCalledWith(0);
  });
});
