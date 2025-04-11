import React, { useState } from 'react';
import { 
    Box, TextField, Button, Typography, Alert, 
    InputAdornment, IconButton, alpha, useTheme
} from '@mui/material';
import { 
    AccountCircle as UserIcon, 
    VpnKey as PasswordIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import authService from '../services/auth';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const theme = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await authService.login(username, password);
            if (onLoginSuccess) {
                onLoginSuccess(data);
            }
        } catch (error) {
            setError(error.response?.data?.error || '登录失败，请检查用户名和密码');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        mb: 3, 
                        borderRadius: 2,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.2)}`
                    }}
                >
                    {error}
                </Alert>
            )}
            
            <TextField
                fullWidth
                label="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
                variant="outlined"
                sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <UserIcon color="action" />
                        </InputAdornment>
                    )
                }}
            />
            
            <TextField
                fullWidth
                label="密码"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <PasswordIcon color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={handleTogglePasswordVisibility}
                                edge="end"
                                aria-label="toggle password visibility"
                                size="small"
                            >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />
            
            <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                sx={{ 
                    mt: 1,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                        transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                }}
            >
                {isLoading ? '登录中...' : '登录'}
            </Button>
        </Box>
    );
};

export default Login; 