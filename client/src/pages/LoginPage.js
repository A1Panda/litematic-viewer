import React, { useState } from 'react';
import { 
    Container, Box, Tabs, Tab, Paper, Button, Typography, 
    Divider, Avatar, useTheme, alpha
} from '@mui/material';
import { 
    Person as PersonIcon, 
    LockOutlined as LockIcon,
    AccountCircle as AccountIcon,
    VpnKey as VpnKeyIcon 
} from '@mui/icons-material';
import Login from '../components/Login';
import Register from '../components/Register';

const LoginPage = ({ onLoginSuccess, onGuestMode }) => {
    const [tabValue, setTabValue] = useState(0);
    const theme = useTheme();

    const handleRegisterSuccess = () => {
        setTabValue(0); // 切换到登录标签
    };

    const handleGuestMode = () => {
        if (onGuestMode) {
            onGuestMode();
        }
    };

    return (
        <Box 
            sx={{ 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                py: 4
            }}
        >
            <Container maxWidth="sm">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 3
                    }}
                >
                    <Avatar 
                        sx={{ 
                            width: 56, 
                            height: 56, 
                            bgcolor: 'white',
                            color: 'primary.main',
                            mb: 2,
                            boxShadow: 3
                        }}
                    >
                        <VpnKeyIcon />
                    </Avatar>
                    <Typography 
                        component="h1" 
                        variant="h4" 
                        fontWeight="700" 
                        color="white"
                        sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}
                    >
                        Minecraft原理图管理系统
                    </Typography>
                </Box>
                
                <Paper 
                    elevation={6} 
                    sx={{ 
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.15)}`,
                        bgcolor: 'background.paper',
                        position: 'relative'
                    }}
                >
                    <Box sx={{ 
                        py: 3,
                        px: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }}>
                        <Tabs 
                            value={tabValue} 
                            onChange={(e, v) => setTabValue(v)}
                            centered
                            variant="fullWidth"
                            textColor="primary"
                            indicatorColor="primary"
                            sx={{ 
                                '& .MuiTab-root': {
                                    borderRadius: 1,
                                    py: 1.5,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    transition: '0.3s',
                                    minHeight: 48,
                                    '&.Mui-selected': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                    }
                                }
                            }}
                        >
                            <Tab 
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LockIcon fontSize="small" />
                                        <span>登录</span>
                                    </Box>
                                } 
                            />
                            <Tab 
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccountIcon fontSize="small" />
                                        <span>注册</span>
                                    </Box>
                                }
                            />
                        </Tabs>
                    </Box>
                    
                    <Box sx={{ p: 4, pt: 3 }}>
                        {tabValue === 0 ? (
                            <Login onLoginSuccess={onLoginSuccess} />
                        ) : (
                            <Register onRegisterSuccess={handleRegisterSuccess} />
                        )}
                    </Box>
                    
                    <Divider sx={{ mx: 4 }} />
                    
                    <Box sx={{ px: 4, py: 3, bgcolor: 'background.default', borderRadius: '0 0 12px 12px' }}>
                        <Typography 
                            variant="body1" 
                            color="text.secondary" 
                            sx={{ 
                                mb: 2, 
                                textAlign: 'center',
                                fontWeight: 500 
                            }}
                        >
                            无需账号，快速体验
                        </Typography>
                        
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<PersonIcon />}
                            fullWidth
                            onClick={handleGuestMode}
                            sx={{ 
                                py: 1.2,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`,
                                '&:hover': {
                                    boxShadow: `0 6px 16px ${alpha(theme.palette.secondary.main, 0.3)}`,
                                    transform: 'translateY(-2px)'
                                },
                                transition: '0.3s'
                            }}
                        >
                            以游客身份访问
                        </Button>
                        
                        <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                                display: 'block', 
                                mt: 1.5,
                                textAlign: 'center'
                            }}
                        >
                            游客模式下，您只能查看公开的原理图
                        </Typography>
                    </Box>
                </Paper>
                
                <Typography 
                    variant="body2" 
                    color="white" 
                    sx={{ 
                        mt: 3, 
                        textAlign: 'center',
                        opacity: 0.8
                    }}
                >
                    &copy; {new Date().getFullYear()} Minecraft原理图管理系统
                </Typography>
            </Container>
        </Box>
    );
};

export default LoginPage; 