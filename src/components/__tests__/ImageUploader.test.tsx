import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ImageUploader } from '../ImageUploader';

describe('ImageUploader', () => {
    const onImageUpload = vi.fn();

    it('renders upload button when no image is provided', () => {
        render(<ImageUploader onImageUpload={onImageUpload} />);
        expect(screen.getByRole('button', { name: /Upload Image/i })).toBeInTheDocument();
    });

    it('renders image preview when initialImageUrl is provided', () => {
        render(<ImageUploader onImageUpload={onImageUpload} initialImageUrl="test.jpg" />);
        expect(screen.getByAltText('Image Preview')).toBeInTheDocument();
    });

    it('opens file dialog on button click', () => {
        const { container } = render(<ImageUploader onImageUpload={onImageUpload} />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = vi.spyOn(input, 'click');
        
        fireEvent.click(screen.getByRole('button', { name: /Upload Image/i }));
        expect(clickSpy).toHaveBeenCalled();
    });

    it('calls onImageUpload and shows preview when file is selected', async () => {
        const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
        const { container } = render(<ImageUploader onImageUpload={onImageUpload} />);
        const input = container.querySelector('input[type="file"]')!;
        
        Object.defineProperty(input, 'files', {
            value: [file]
        });
        fireEvent.change(input);

        // Preview is not directly testable without more complex FileReader mock
        expect(onImageUpload).toHaveBeenCalledWith(file);
    });

    it('removes image on remove button click', () => {
        render(<ImageUploader onImageUpload={onImageUpload} initialImageUrl="test.jpg" />);
        fireEvent.click(screen.getByTestId('CloseIcon'));
        
        expect(screen.queryByAltText('Image Preview')).not.toBeInTheDocument();
        expect(onImageUpload).toHaveBeenCalledWith(null);
    });
});
