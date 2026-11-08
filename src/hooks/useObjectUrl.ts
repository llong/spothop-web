import { useEffect, useState } from 'react';

/** Object URL for a file/blob, revoked automatically when it changes or the component unmounts. */
export function useObjectUrl(blob: Blob | null | undefined): string | undefined {
    const [url, setUrl] = useState<string>();

    useEffect(() => {
        if (!blob) return setUrl(undefined);
        const objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [blob]);

    return url;
}
