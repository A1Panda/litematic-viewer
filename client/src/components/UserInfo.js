import React from 'react';
import { Box, Typography, Avatar, Chip, IconButton, Tooltip } from '@mui/material';
import { Logout as LogoutIcon, AdminPanelSettings as AdminIcon, Person as PersonIcon } from '@mui/icons-material';
import authService from '../services/auth';

const UserInfo = ({ user, onLogout, isGuestMode }) => {
    const handleLogout = () => {
        if (!isGuestMode) {
            authService.logout();
        }
        if (onLogout) {
            onLogout();
        }
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

    // 如果非游客模式但user为null，则显示加载中或返回空
    if (!isGuestMode && !user) {
        return null; // 返回空，避免渲染错误
    }

    // 已登录/游客模式直接显示用户信息
    return (
        <Box
            sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                height: '40px'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isGuestMode ? (
                    <Avatar
                        sx={{ 
                            width: 34, 
                            height: 34, 
                            bgcolor: 'grey.100',
                            color: 'primary.main',
                            border: '2px solid',
                            borderColor: 'primary.light'
                        }}
                    >
                        <PersonIcon fontSize="small" sx={{ fontSize: '1.1rem' }} />
                    </Avatar>
                ) : (
                    <Avatar
                        sx={{ 
                            width: 34, 
                            height: 34, 
                            bgcolor: getAvatarColor(user?.username || ''),
                            color: 'white',
                            border: '2px solid',
                            borderColor: 'primary.light'
                        }}
                    >
                        {getAvatarText(user?.username || '')}
                    </Avatar>
                )}
                
                <Box sx={{ ml: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight="600">
                        {isGuestMode ? '游客' : user?.username || '用户'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0 }}>
                        <Chip 
                            label={isGuestMode ? '游客模式' : (user?.role === 'admin' ? '管理员' : '用户')}
                            size="small"
                            color={isGuestMode ? 'default' : (user?.role === 'admin' ? 'secondary' : 'primary')}
                            sx={{ 
                                height: 18, 
                                fontSize: '0.625rem',
                                mr: 1,
                                '& .MuiChip-label': {
                                    px: 0.8
                                }
                            }}
                            icon={isGuestMode ? <PersonIcon fontSize="small" sx={{ fontSize: '0.7rem', ml: '2px' }} /> : (user?.role === 'admin' ? <AdminIcon fontSize="small" sx={{ fontSize: '0.7rem', ml: '2px' }} /> : null)}
                        />
                    </Box>
                </Box>
            </Box>
            
            <Tooltip title={isGuestMode ? "退出游客模式" : "退出登录"}>
                <IconButton 
                    color={isGuestMode ? "default" : "primary"}
                    onClick={handleLogout}
                    size="small"
                    sx={{ 
                        ml: 1,
                        border: '1px solid',
                        borderColor: isGuestMode ? 'divider' : 'primary.light',
                        width: 30,
                        height: 30
                    }}
                >
                    <LogoutIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default UserInfo; 