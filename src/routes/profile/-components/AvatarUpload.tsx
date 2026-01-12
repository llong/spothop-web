import { useState, useRef } from "react";
import supabase from "../../../supabase";
import {
    Box,
    CircularProgress,
    Avatar,
    IconButton,
    Modal,
    Button,
} from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAtom } from "jotai";
import { userAtom } from "../../../atoms/auth";
import { getOptimizedImageUrl } from "src/utils/imageOptimization";

interface AvatarUploadProps {
    avatarUrl: string | null;
    onUpload: (url: string) => Promise<void>;
}

export const AvatarUpload = ({ avatarUrl, onUpload }: AvatarUploadProps) => {
    const [user] = useAtom(userAtom);
    const [uploading, setUploading] = useState(false);
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [openCrop, setOpenCrop] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () =>
                setImgSrc(reader.result?.toString() || ''),
            );
            reader.readAsDataURL(e.target.files[0]);
            setOpenCrop(true);
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                1,
                width,
                height,
            ),
            width,
            height,
        ));
    };

    const uploadAvatar = async () => {
        if (!completedCrop || !imgRef.current) {
            throw new Error("Crop details not available.");
        }

        const canvas = document.createElement("canvas");
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No 2d context");
        }

        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            500,
            500
        );

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/webp', 0.9);
        });

        if (!blob) {
            throw new Error("Failed to create blob.");
        }

        try {
            setUploading(true);
            setOpenCrop(false);

            const file = (document.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
            if (!file) {
                throw new Error("No file selected.");
            }
            const filePath = `${user?.user.id}.webp`;

            const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, blob, { contentType: 'image/webp', upsert: true, cacheControl: '0' });

            if (uploadError) {
                throw uploadError;
            }

            let { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            publicUrl += `?t=${new Date().getTime()}`;

            await onUpload(publicUrl);

        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Modal open={openCrop} onClose={() => setOpenCrop(false)}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    {imgSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imgSrc}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    )}
                    <Button onClick={uploadAvatar} variant="contained" sx={{ mt: 2 }} disabled={uploading}>
                        {uploading ? <CircularProgress size={24} /> : "Crop and Upload"}
                    </Button>
                </Box>
            </Modal>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                    src={avatarUrl ? getOptimizedImageUrl(avatarUrl) : ""}
                    alt="User profile picture"
                    sx={{ width: 160, height: 160, mb: 2, border: 2, borderColor: 'primary.main' }}
                />
                <IconButton
                    color="primary"
                    aria-label="upload profile picture"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'white',
                        '&:hover': {
                            backgroundColor: 'grey.200',
                        },
                    }}
                >
                    <PhotoCamera />
                </IconButton>
                <input
                    hidden
                    accept="image/*"
                    type="file"
                    ref={fileInputRef}
                    onChange={onSelectFile}
                    data-testid="avatar-file-input"
                    onClick={() => {
                        if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                        }
                    }}
                />
            </Box>
        </>
    );
};
