import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import authService from './services/auth';
import { Container, Box } from '@mui/material';

function App() {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [isLoggedIn, setIsLoggedIn] = useState(!!authService.getCurrentUser());

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
    };

    return (
        <Container>
            <Box sx={{ mt: 4 }}>
                {isLoggedIn ? (
                    <HomePage user={user} />
                ) : (
                    <LoginPage onLoginSuccess={handleLoginSuccess} />
                )}
            </Box>
        </Container>
    );
}

export default App; 