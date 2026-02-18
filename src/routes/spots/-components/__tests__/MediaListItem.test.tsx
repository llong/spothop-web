import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MediaListItem } from '../MediaListItem';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const mockItem = {
  id: 'm1',
  url: 'https://example.com/photo1.jpg',
  type: 'photo' as const,
  author: { id: 'u1', username: 'user1', avatarUrl: null },
  createdAt: new Date().toISOString(),
  likeCount: 5,
  commentCount: 3,
  isLiked: false
};

// Mock hooks
vi.mock('src/hooks/useFeedQueries', () => ({
  useToggleFollow: vi.fn(() => ({ mutate: vi.fn(), isPending: false }))
}));

vi.mock('src/hooks/useProfileQueries', () => ({
  useProfileQuery: vi.fn(() => ({ data: { role: 'user' } }))
}));

vi.mock('src/hooks/useAdminQueries', () => ({
  useAdminQueries: vi.fn(() => ({ deleteContent: vi.fn(), isActioning: false }))
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <div>{children}</div>
}));

describe('MediaListItem', () => {
  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props: any) => {
    return render(
      <ThemeProvider theme={theme}>
        <MediaListItem {...props} />
      </ThemeProvider>
    );
  };

  it('renders correctly', () => {
    renderComponent({
      item: mockItem,
      onLike: vi.fn(),
      onComment: vi.fn(),
      onShare: vi.fn(),
      onClick: vi.fn()
    });
    
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Like count
    expect(screen.getByText('3')).toBeInTheDocument(); // Comment count
  });

  it('calls onLike when like button is clicked', () => {
    const onLike = vi.fn();
    renderComponent({
      item: mockItem,
      onLike,
      onComment: vi.fn(),
      onShare: vi.fn(),
      onClick: vi.fn()
    });
    
    // MUI IconButton has no text, so we find it by svg or just select all buttons.
    // Indexing buttons might be fragile. Let's use labels if available, but they aren't.
    // The like button is the second IconButton (index 1).
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(onLike).toHaveBeenCalledWith(mockItem.id, mockItem.type);
  });

  it('calls onComment when comment button is clicked', () => {
    const onComment = vi.fn();
    renderComponent({
      item: mockItem,
      onLike: vi.fn(),
      onComment,
      onShare: vi.fn(),
      onClick: vi.fn()
    });
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onComment).toHaveBeenCalledWith(mockItem);
  });

  it('calls onClick when media container is clicked', () => {
    const onClick = vi.fn();
    renderComponent({
      item: mockItem,
      onLike: vi.fn(),
      onComment: vi.fn(),
      onShare: vi.fn(),
      onClick
    });
    
    const img = screen.getByRole('img');
    fireEvent.click(img.parentElement!);
    expect(onClick).toHaveBeenCalled();
  });
});
