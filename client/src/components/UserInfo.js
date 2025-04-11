import React from 'react';
import { Box, Typography, Button, Avatar, Chip, Paper, IconButton, Tooltip } from '@mui/material';
import { Logout as LogoutIcon, AdminPanelSettings as AdminIcon, Person as PersonIcon } from '@mui/icons-material';
import authService from '../services/auth';

const UserInfo = ({ user, onLogout }) => {
    const handleLogout = () => {
        authService.logout();
        onLogout();
    };

    // 从用户名生成头像标签
    const getAvatarText = (username) => {
        if (!username) return '?';
        return username.charAt(0).toUpperCase();
    };

    // 生成随机颜色（基于用户名）
    const getAvatarColor = (username) => {
        if (!username) return '#757575';
        const colors = [
            '#1E88E5', '#42A5F5', '#26A69A', '#66BB6A', 
            '#D81B60', '#EC407A', '#7E57C2', '#5E35B1',
            '#FF7043', '#F4511E', '#FFB300', '#FFA000'
        ];
        const index = username.charCodeAt(0) % colors.length;
        return colors[index];
    };

    if (!user) {
        return (
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                    variant="outlined" 
                    color="primary"
                    sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500
                    }}
                    href="/login"
                >
                    登录
                </Button>
            </Box>
        );
    }

    return (
        <Paper 
            elevation={1} 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: { xs: 1.5, sm: 2 },
                px: { xs: 2, sm: 3 }, 
                mb: 3,
                borderRadius: { xs: 1, sm: 2 },
                background: 'linear-gradient(to right, #ffffff, #f9fafb)'
            }}
            className="animate-fade-in"
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                <Avatar 
                    sx={{ 
                        bgcolor: getAvatarColor(user.username),
                        width: { xs: 36, sm: 42 },
                        height: { xs: 36, sm: 42 },
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    {getAvatarText(user.username)}
                </Avatar>
                <Box>
                    <Typography 
                        variant="h6" 
                        fontWeight="600" 
                        sx={{ 
                            lineHeight: 1.2,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        {user.username}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        {user.role === 'admin' ? (
                            <Chip 
                                icon={<AdminIcon fontSize="small" />}
                                label="管理员" 
                                size="small" 
                                color="error"
                                sx={{ 
                                    height: 24,
                                    fontWeight: 500
                                }}
                            />
                        ) : (
                            <Chip 
                                icon={<PersonIcon fontSize="small" />}
                                label="普通用户" 
                                size="small" 
                                color="primary"
                                sx={{ 
                                    height: 24,
                                    fontWeight: 500
                                }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>
            
            <Tooltip title="退出登录">
                <IconButton 
                    color="default" 
                    onClick={handleLogout}
                    sx={{ 
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <LogoutIcon />
                </IconButton>
            </Tooltip>
        </Paper>
    );
};

export default UserInfo; 