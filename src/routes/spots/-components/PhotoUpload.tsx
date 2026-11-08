import { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { MediaSection, UploadTile } from './MediaUploadParts';

interface PhotoUploadProps {
    onFilesSelect: (files: File[]) => void;
}

const PhotoPreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
    const url = useObjectUrl(file);
    return (
        <Box sx={{ position: 'relative', aspectRatio: '1', borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover' }}>
            <Box
                component="img"
                src={url}
                alt={file.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <IconButton
                aria-label="remove photo"
                onClick={onRemove}
                size="small"
                sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    color: 'common.white',
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
                }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    );
};

export const PhotoUpload = ({ onFilesSelect }: PhotoUploadProps) => {
    const [files, setFiles] = useState<File[]>([]);

    const update = (next: File[]) => {
        setFiles(next);
        onFilesSelect(next);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(event.target.files ?? []);
        const images = picked.filter((file) => file.type.startsWith('image/'));
        if (images.length !== picked.length) alert('Some files were skipped because they are not valid images.');
        update([...files, ...images]);
        event.target.value = ''; // allow picking the same photo again after removing it
    };

    return (
        <MediaSection title="Photos" badge="Required">
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                {files.map((file, index) => (
                    <PhotoPreview key={`${file.name}-${file.lastModified}-${index}`} file={file} onRemove={() => update(files.filter((_, i) => i !== index))} />
                ))}
                <Box sx={{ gridColumn: files.length === 0 ? '1 / -1' : undefined }}>
                    <UploadTile
                        compact={files.length > 0}
                        icon={<AddPhotoAlternateOutlinedIcon sx={{ fontSize: files.length > 0 ? 28 : 36 }} />}
                        title={files.length > 0 ? 'Add more' : 'Add photos'}
                        hint={files.length > 0 ? undefined : 'Show off the spot. You can pick several at once.'}
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                    />
                </Box>
            </Box>
        </MediaSection>
    );
};
