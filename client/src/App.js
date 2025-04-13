import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import authService from './services/auth';
import { Box, CssBaseline, createTheme, ThemeProvider } from '@mui/material';

// 创建主题
const theme = createTheme({
    palette: {
        primary: {
            main: '#2196f3',
        },
        secondary: {
            main: '#f50057',
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
});

function App() {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [isLoggedIn, setIsLoggedIn] = useState(!!authService.getCurrentUser());
    const [guestMode, setGuestMode] = useState(false);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
        setGuestMode(false);
    };

    const enterGuestMode = () => {
        setGuestMode(true);
    };

    const exitGuestMode = () => {
        setGuestMode(false);
    };

    // 将enterGuestMode暴露为全局函数
    useEffect(() => {
        // 将函数暴露到全局，供其他组件调用
        window.enterGuestMode = enterGuestMode;
        
        // 清理函数
        return () => {
            delete window.enterGuestMode;
        };
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ 
                minHeight: '100vh',
                bgcolor: '#f5f5f5'
            }}>
                {isLoggedIn || guestMode ? (
                    <HomePage 
                        user={user} 
                        isGuestMode={guestMode}
                        onExitGuestMode={exitGuestMode}
                    />
                ) : (
                    <LoginPage 
                        onLoginSuccess={handleLoginSuccess}
                        onGuestMode={enterGuestMode}
                    />
                )}
            </Box>
        </ThemeProvider>
    );
}

export default App; 