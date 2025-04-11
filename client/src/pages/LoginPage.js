import React, { useState } from 'react';
import { Container, Box, Tabs, Tab, Paper } from '@mui/material';
import Login from '../components/Login';
import Register from '../components/Register';

const LoginPage = ({ onLoginSuccess }) => {
    const [tabValue, setTabValue] = useState(0);

    const handleRegisterSuccess = () => {
        setTabValue(0); // 切换到登录标签
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs 
                            value={tabValue} 
                            onChange={(e, v) => setTabValue(v)}
                            centered
                        >
                            <Tab label="登录" />
                            <Tab label="注册" />
                        </Tabs>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                        {tabValue === 0 ? (
                            <Login onLoginSuccess={onLoginSuccess} />
                        ) : (
                            <Register onRegisterSuccess={handleRegisterSuccess} />
                        )}
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage; 