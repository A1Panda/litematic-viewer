import React, { useState } from 'react';
import {
    Grid, 
    Card, 
    CardContent, 
    CardActions, 
    IconButton,
    Typography,
    Box,
    Switch, 
    FormControlLabel, 
    Tooltip,
    Chip,
    Divider,
    CardActionArea
} from '@mui/material';
import { 
    Delete as DeleteIcon, 
    Edit as EditIcon, 
    Public as PublicIcon, 
    Lock as LockIcon,
    AccessTime as AccessTimeIcon,
    Person as PersonIcon 
} from '@mui/icons-material';
import SchematicDetail from './SchematicDetail';
import { updateSchematicVisibility } from '../services/api';

const SchematicList = ({ schematics, onDelete, onEdit, currentUser }) => {
    const [selectedSchematic, setSelectedSchematic] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const handleViewDetail = (schematic) => {
        setSelectedSchematic(schematic);
        setDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setSelectedSchematic(null);
    };

    const handleVisibilityChange = async (event, schematic) => {
        try {
            // 阻止事件冒泡，防止触发CardActionArea的点击事件
            event.stopPropagation();
            
            const newIsPublic = !schematic.is_public;
            console.log(`正在将原理图 "${schematic.name}" 设置为: ${newIsPublic ? '公开' : '私有'}`);
            
            // 先在本地更新状态，提供即时反馈
            const localUpdatedSchematic = {
                ...schematic,
                is_public: newIsPublic
            };
            
            // 找到并更新原理图在列表中的位置
            const schematicIndex = schematics.findIndex(s => s.id === schematic.id);
            if (schematicIndex !== -1) {
                // 本地临时更新，显示状态变化
                const updatedSchematics = [...schematics];
                updatedSchematics[schematicIndex] = localUpdatedSchematic;
                // 在父组件中刷新原理图列表
                if (onEdit) {
                    onEdit(localUpdatedSchematic);
                }
            }
            
            try {
                // 调用API更新可见性
                const updatedSchematic = await updateSchematicVisibility(schematic.id, newIsPublic);
                console.log('服务器更新成功:', updatedSchematic);
                
                // 由于服务器可能返回更多更新后的数据，我们应该触发完整刷新
                if (onEdit) {
                    console.log('触发重新加载原理图列表');
                    onEdit(updatedSchematic);
                }
            } catch (error) {
                console.error('服务器更新失败:', error);
                // 恢复原始状态
                alert('更新可见性失败: ' + (error.message || '未知错误') + '\n状态已恢复');
                
                // 这里可以恢复原始状态，但由于onEdit会触发刷新，所以不需要额外处理
                if (onEdit) {
                    onEdit(schematic); // 使用原始schematic刷新
                }
            }
        } catch (error) {
            console.error('更新可见性失败:', error);
            alert('更新可见性失败: ' + (error.message || '未知错误'));
        }
    };

    const canModify = (schematic) => {
        return currentUser && (
            currentUser.role === 'admin' || 
            currentUser.id === schematic.user_id
        );
    };

    // 格式化日期显示
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Box sx={{ py: 2 }} className="animate-fade-in">
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2 
                }}
            >
                <Typography variant="h6" fontWeight="600" color="primary.dark">
                    {schematics.length > 0 
                        ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>原理图</span>
                                <Chip 
                                    label={schematics.length} 
                                    size="small" 
                                    color="primary" 
                                    sx={{ height: 22, minWidth: 22 }}
                                />
                            </Box>
                        ) 
                        : '暂无原理图'
                    }
            </Typography>
            </Box>
            
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mt: 0.5 }}>
                {schematics.map((schematic) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={schematic.id}>
                        <Card 
                            elevation={2} 
                            sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: { xs: 1, sm: 2 },
                                transition: 'all 0.3s ease',
                                overflow: 'hidden',
                                backgroundColor: 'background.paper !important',
                                borderLeft: theme => `3px solid ${
                                    schematic.is_public 
                                        ? theme.palette.primary.main
                                        : theme.palette.grey[300]
                                }`,
                                '&:hover': {
                                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                                }
                            }}
                        >
                            <Box sx={{ flexGrow: 1 }}>
                                <CardActionArea 
                                    onClick={() => handleViewDetail(schematic)}
                                    sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'flex-start',
                                        width: '100%',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        backgroundColor: 'background.paper !important'
                                    }}
                                >
                                    <CardContent sx={{ 
                                        width: '100%', 
                                        flexGrow: 1, 
                                        p: { xs: 1.5, sm: 2 },
                                        '&:last-child': { pb: { xs: 1.5, sm: 2 } },
                                        position: 'relative',
                                        zIndex: 1,
                                        backgroundColor: 'background.paper !important'
                                    }}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'flex-start',
                                            mb: 1.5
                                        }}>
                                            <Box sx={{ maxWidth: 'calc(100% - 30px)' }}>
                                                <Typography 
                                                    variant="subtitle1" 
                                                    component="div" 
                                                    title={schematic.name}
                                                    sx={{ 
                                                        fontWeight: 600,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        display: 'block',
                                                        lineHeight: 1.3,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    {schematic.name}
                                                </Typography>
                                                
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                    <Chip
                                                        size="small"
                                                        label={schematic.is_public ? "公开" : "私有"}
                                                        color={schematic.is_public ? "primary" : "default"}
                                                        icon={schematic.is_public ? <PublicIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                                                        sx={{ 
                                                            height: 20, 
                                                            '& .MuiChip-label': { 
                                                                px: 1,
                                                                fontSize: '0.675rem'
                                                            },
                                                            '& .MuiChip-icon': {
                                                                fontSize: '0.875rem',
                                                                ml: 0.5
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {schematic.name.endsWith('.litematic') 
                                                        ? schematic.name.substring(0, schematic.name.length - 10) 
                                                        : schematic.name}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, color: 'text.secondary' }}>
                                            <PersonIcon fontSize="small" sx={{ mr: 0.5, flexShrink: 0 }} />
                                            <Typography 
                                                variant="body2" 
                                                component="div"
                                                color="text.secondary" 
                                                sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    maxWidth: 'calc(100% - 20px)',
                                                    overflow: 'hidden'
                                                }}
                                                title={schematic.creator_name}
                                            >
                                                <span
                                                    style={{ 
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {schematic.creator_name}
                                                </span>
                                                {currentUser && schematic.user_id === currentUser.id && (
                                                    <Chip 
                                                        label="我" 
                                                        size="small" 
                                                        sx={{ 
                                                            ml: 1, 
                                                            height: 20, 
                                                            fontSize: '0.625rem',
                                                            bgcolor: 'primary.light',
                                                            color: 'white',
                                                            flexShrink: 0
                                                        }} 
                                                    />
                                                )}
                                            </Typography>
                                        </Box>
                                        
                                        {schematic.created_at && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
                                                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDate(schematic.created_at)}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box 
                                            sx={{ 
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                bottom: 0,
                                                left: 0,
                                                pt: 6,
                                                opacity: 0.6,
                                                display: 'none',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                pointerEvents: 'none'
                                            }}
                                        >
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Box>
                            
                            {canModify(schematic) && (
                                <>
                                    <Divider />
                                    <CardActions sx={{ 
                                        justifyContent: 'space-between', 
                                        px: { xs: 1.5, sm: 2 }, 
                                        py: { xs: 0.5, sm: 0.5 },
                                        flexWrap: 'nowrap',
                                        backgroundColor: 'background.paper !important',
                                        position: 'relative',
                                        zIndex: 1,
                                        minHeight: 40,
                                        maxHeight: 40
                                    }}>
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                cursor: 'pointer'
                                            }}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleVisibilityChange(event, schematic);
                                            }}
                                        >
                                            <Switch
                                                checked={!!schematic.is_public}
                                                onChange={(event) => handleVisibilityChange(event, schematic)}
                                                size="small"
                                                sx={{ 
                                                    mr: 0.5,
                                                    '& .MuiSwitch-thumb': {
                                                        width: 12,
                                                        height: 12
                                                    },
                                                    '& .MuiSwitch-switchBase': {
                                                        padding: 6
                                                    },
                                                    '& .MuiSwitch-track': {
                                                        borderRadius: 7
                                                    }
                                                }}
                                            />
                                            <Typography 
                                                variant="body2"
                                                component="span"
                                                sx={{ 
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {schematic.is_public ? "公开" : "私有"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexShrink: 0 }}>
                                            <Tooltip 
                                                title="编辑"
                                                placement="top"
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={(event) => {
                                                        // 阻止事件冒泡，防止触发CardActionArea的点击事件
                                                        event.stopPropagation();
                                                        event.preventDefault();
                                                        
                                                        console.log('编辑按钮被点击，原理图ID:', schematic.id);
                                                        
                                                        // 直接调用全局方法
                                                        if (window.openSchematicEditor) {
                                                            window.openSchematicEditor(schematic);
                                                            return;
                                                        }
                                                        
                                                        // 创建一个新的schematic对象，并删除is_public属性
                                                        const editSchematic = {...schematic};
                                                        
                                                        if (typeof onEdit === 'function') {
                                                            console.log('调用onEdit函数，schematic ID:', editSchematic.id);
                                                            onEdit(editSchematic);
                                                        } else {
                                                            console.error('onEdit回调未定义!', typeof onEdit);
                                                            
                                                            // 如果回调未定义，使用一个备用方法
                                                            alert('即将编辑原理图: ' + schematic.name);
                                                        }
                                                    }}
                                                    sx={{ 
                                                        p: 0.75,
                                                        ml: 0.5,
                                                        zIndex: 10,
                                                        position: 'relative',
                                                        color: 'primary.main',
                                                        bgcolor: 'rgba(255,255,255,0.5)',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(0,0,0,0.04)'
                                                        }
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" sx={{ fontSize: '1.1rem' }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip 
                                                title="删除"
                                                placement="top"
                                            >
                                <IconButton
                                                    size="small"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        onDelete(schematic.id);
                                                    }}
                                                    color="error"
                                                    sx={{ 
                                                        p: 0.75,
                                                        ml: 0.5
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </CardActions>
                                </>
                            )}
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <SchematicDetail
                open={detailOpen}
                onClose={handleCloseDetail}
                schematicId={selectedSchematic?.id}
            />
        </Box>
    );
};

export default SchematicList; 