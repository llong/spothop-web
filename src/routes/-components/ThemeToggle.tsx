import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode, SettingsBrightness } from '@mui/icons-material';
import { useAtom } from 'jotai';
import { themeModeAtom } from 'src/atoms/ui';

export function ThemeToggle({ showLabel }: { showLabel?: boolean }) {
    const [mode, setMode] = useAtom(themeModeAtom);

    const toggleMode = () => {
        if (mode === 'light') setMode('dark');
        else if (mode === 'dark') setMode('system');
        else setMode('light');
    };

    const getTooltip = () => {
        if (mode === 'light') return 'Switch to Dark Mode';
        if (mode === 'dark') return 'Switch to System Default';
        return 'Switch to Light Mode';
    };

    return (
        <Tooltip title={getTooltip()}>
            <IconButton onClick={toggleMode} color="inherit" sx={{ display: 'flex', gap: 1, borderRadius: showLabel ? 10 : '50%' }}>
                {mode === 'light' ? <LightMode /> : mode === 'dark' ? <DarkMode /> : <SettingsBrightness />}
                {showLabel && (
                    <span style={{ fontSize: '1rem', fontWeight: 700, width: '120px', textAlign: 'left' }}>
                        {mode === 'light' ? 'Light Mode' : mode === 'dark' ? 'Dark Mode' : 'System Theme'}
                    </span>
                )}
            </IconButton>
        </Tooltip>
    );
}
