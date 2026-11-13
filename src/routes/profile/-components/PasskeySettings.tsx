import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, IconButton, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyIcon from "@mui/icons-material/Key";
import supabase from "@/supabase";
import { registerPasskey } from "@/lib/passkeys";

interface PasskeyRow {
    id: string;
    friendly_name?: string | null;
    created_at: string;
    last_used_at?: string | null;
}

export const PasskeySettings = () => {
    const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        const { data, error } = await supabase.auth.passkey.list();
        if (error) {
            setError(error.message);
        } else {
            setPasskeys((data as PasskeyRow[]) ?? []);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async () => {
        setError("");
        setBusy(true);
        const { error } = await registerPasskey();
        setBusy(false);
        if (error) {
            setError(error.message);
        } else {
            await load();
        }
    };

    const handleDelete = async (passkeyId: string) => {
        setError("");
        const { error } = await supabase.auth.passkey.delete({ passkeyId });
        if (error) {
            setError(error.message);
        } else {
            await load();
        }
    };

    return (
        <Box component="section">
            <Typography variant="h6" component="h2" gutterBottom fontWeight={700}>
                Passkeys
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Sign in with Face ID, Touch ID or a security key instead of a password.
            </Typography>
            {error && <Alert severity="error" sx={{ my: 1 }}>{error}</Alert>}
            <List dense disablePadding>
                {passkeys.map((p) => (
                    <ListItem
                        key={p.id}
                        disableGutters
                        secondaryAction={
                            <IconButton edge="end" aria-label="Delete passkey" onClick={() => handleDelete(p.id)}>
                                <DeleteIcon />
                            </IconButton>
                        }
                    >
                        <ListItemText
                            primary={p.friendly_name || "Passkey"}
                            secondary={`Added ${new Date(p.created_at).toLocaleDateString()}${
                                p.last_used_at ? ` · last used ${new Date(p.last_used_at).toLocaleDateString()}` : ""
                            }`}
                        />
                    </ListItem>
                ))}
            </List>
            <Stack direction="row" sx={{ mt: 1 }}>
                <Button variant="outlined" startIcon={<KeyIcon />} onClick={handleAdd} disabled={busy}>
                    Add a passkey
                </Button>
            </Stack>
        </Box>
    );
};
