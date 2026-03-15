import { Button, Snackbar, Alert } from '@mui/material';
import { useAtom } from 'jotai';
import { pwaUpdateAtom } from '@/atoms/pwa';

export function PWAUpdateToast() {
    const [pwaState, setPwaState] = useAtom(pwaUpdateAtom);

    const handleClose = () => {
        setPwaState(prev => ({ ...prev, needRefresh: false }));
    };

    const handleUpdate = () => {
        pwaState.updateFunction(true);
    };

    return (
        <Snackbar
            open={pwaState.needRefresh}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ bottom: { xs: 80, sm: 20 } }} // Avoid overlapping with bottom nav on mobile
        >
            <Alert
                severity="info"
                variant="filled"
                onClose={handleClose}
                action={
                    <Button 
                        color="inherit" 
                        size="small" 
                        onClick={handleUpdate}
                        sx={{ fontWeight: 'bold' }}
                    >
                        Update
                    </Button>
                }
                sx={{ width: '100%', alignItems: 'center' }}
            >
                New version available!
            </Alert>
        </Snackbar>
    );
}
