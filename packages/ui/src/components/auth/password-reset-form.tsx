'use client';
import { useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Grid,
    Link,
    TextField,
    Typography,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { Form } from '../form';
import { SnackBarAlert } from '../snack-bar-alert';

interface PasswordResetFormProps {
    icon?: React.ReactNode;
    title?: React.ReactNode | string;
    subTitle?: React.ReactNode | string;
    error?: string;
    recoverPasswordUrl: URL | string;
    resetPassword: (formData: FormData) => Promise<void>;
    signInUrl: string;
    formProps?: object[];
}

export function PasswordResetForm({
    icon,
    title,
    subTitle,
    error: authError,
    recoverPasswordUrl,
    resetPassword,
    signInUrl,
    ...formProps
}: PasswordResetFormProps): JSX.Element {
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = (data: FormData): void => {
        if (!authError) {
            resetPassword(data).catch((error) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- allow error message
                setErrorMsg(error.message as string);
            });
        }
    };

    return (
        <Box
            sx={{
                my: 8,
                mx: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                {icon ?? <LockResetIcon />}
            </Avatar>
            {title ? <Typography align="center" color="primary" component="h2" gutterBottom variant="h4">{title}</Typography> : null}
            {subTitle ? <Typography align="center" color="primary" component="h3" gutterBottom variant="h5">{subTitle}</Typography> : null}
            {authError ? (
                <Grid container justifyContent="center" spacing={2}>
                    <Grid item>
                        <Alert severity="error" variant="outlined">{authError}</Alert>
                    </Grid>
                    <Grid item>
                        <Link href={recoverPasswordUrl.toString()} variant="body2">
                            Resend Password Recovery Email
                        </Link>
                    </Grid>
                </Grid>
            ) : (
                <Grid container justifyContent="center" spacing={2}>
                    <Grid item>
                        <Typography variant="body2">
                            Enter a new password
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Form
                            autoComplete="on"
                            sx={{ mt: 3 }}
                            {...formProps}
                        >
                            <Grid container maxWidth={450} minWidth={350} spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        id="password"
                                        label="Password"
                                        name="password"
                                        required
                                        type="password"
                                    />
                                </Grid>
                            </Grid>
                            <Button
                                formAction={handleSubmit}
                                fullWidth
                                sx={{ mt: 3, mb: 2 }}
                                type="submit"
                                variant="contained"
                            >
                                Update Password
                            </Button>
                            <Grid container justifyContent="flex-end">
                                <Grid item>
                                    <Link href={signInUrl} variant="body2">
                                        Remembered your password? Sign in
                                    </Link>
                                </Grid>
                            </Grid>
                        </Form>
                        <SnackBarAlert clear={() => { setErrorMsg('') }} message={errorMsg} severity="error" />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default PasswordResetForm;
