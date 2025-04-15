import React, { useState, useEffect } from 'react';
import { 
    List, 
    ListItem, 
    ListItemAvatar, 
    ListItemText, 
    Avatar, 
    Typography, 
    Box, 
    Chip, 
    Paper,
    Tooltip,
    Divider
} from '@mui/material';
import { 
    Layers as LayersIcon, 
    Error as ErrorIcon 
} from '@mui/icons-material';
import { convertBlockNames } from '../services/blockNames';

// 处理方块名称到图片路径的映射
const getBlockImagePath = (blockName) => {
    try {
        // 移除 minecraft: 前缀并转换为小写
        const cleanName = blockName.replace('minecraft:', '').toLowerCase();
        
        // 移除方块状态信息（如果有的话）
        const baseName = cleanName.split('[')[0];
        
        // 先尝试 png 格式
        const pngPath = `http://mcid.lingningyu.cn/use_mcid/img/BAI/${baseName}.png`;
        
        // 创建一个新的 Image 对象来检查图片是否存在
        const img = new Image();
        img.src = pngPath;
        
        // 如果 png 不存在，则使用 gif
        return new Promise((resolve) => {
            img.onload = () => resolve(pngPath);
            img.onerror = () => resolve(`http://mcid.lingningyu.cn/use_mcid/img/BAI/${baseName}.gif`);
        });
    } catch (error) {
        console.error('获取方块图片路径失败:', error);
        return null;
    }
};

const MaterialItem = ({ material }) => {
    const [imagePath, setImagePath] = useState(null);

    useEffect(() => {
        getBlockImagePath(material.blockId).then(path => {
            setImagePath(path);
        });
    }, [material.blockId]);

    const boxes = Math.floor(material.count / 1728);
    const remainderAfterBoxes = material.count % 1728;
    const stacks = Math.floor(remainderAfterBoxes / 64);
    const remainder = remainderAfterBoxes % 64;

    return (
        <React.Fragment>
            <ListItem sx={{ py: 1.5 }}>
                <ListItemAvatar>
                    <Avatar
                        src={imagePath}
                        alt={material.displayName}
                        variant="rounded"
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'grey.100',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            '& img': {
                                objectFit: 'contain',
                                imageRendering: 'pixelated'
                            }
                        }}
                    >
                        {material.displayName[0]}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={
                        <Tooltip title={material.blockId} arrow placement="top">
                            <Typography 
                                variant="body2" 
                                fontWeight="500"
                                className="text-fade"
                                sx={{ 
                                    maxWidth: { xs: '10ch', sm: '15ch', md: '20ch' },
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block'
                                }}
                            >
                                {material.displayName}
                            </Typography>
                        </Tooltip>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                    secondary={
                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip
                                size="small"
                                label={`${material.count.toLocaleString()} 个`}
                                sx={{ 
                                    height: 20, 
                                    fontSize: '0.675rem',
                                    bgcolor: 'primary.50',
                                    color: 'primary.dark',
                                    fontWeight: 600
                                }}
                            />
                            {boxes > 0 && (
                                <Chip
                                    size="small"
                                    label={`${boxes} 盒`}
                                    sx={{ 
                                        height: 20, 
                                        fontSize: '0.675rem',
                                        bgcolor: 'secondary.50',
                                        color: 'secondary.dark'
                                    }}
                                />
                            )}
                            {stacks > 0 && (
                                <Chip
                                    size="small"
                                    label={`${stacks} 组`}
                                    sx={{ 
                                        height: 20, 
                                        fontSize: '0.675rem',
                                        bgcolor: 'info.50',
                                        color: 'info.dark'
                                    }}
                                />
                            )}
                            {remainder > 0 && (
                                <Chip
                                    size="small"
                                    label={`${remainder} 个`}
                                    sx={{ 
                                        height: 20, 
                                        fontSize: '0.675rem',
                                        bgcolor: 'grey.100',
                                        color: 'grey.700'
                                    }}
                                />
                            )}
                        </Box>
                    }
                />
            </ListItem>
        </React.Fragment>
    );
};

const MaterialsList = ({ materials }) => {
    if (!materials || Object.keys(materials).length === 0) {
        return (
            <Box sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200
            }}>
                <ErrorIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">暂无材料数据</Typography>
            </Box>
        );
    }

    // 将materials对象转换为数组并排序
    const materialsArray = Object.entries(materials).map(([blockId, count]) => ({
        blockId,
        count,
        displayName: blockId // 临时使用blockId作为显示名称
    })).sort((a, b) => b.count - a.count);

    // 使用中文名称映射
    const materialsWithChineseNames = convertBlockNames(materialsArray);
    
    // 计算总材料数量
    const totalCount = materialsWithChineseNames.reduce((sum, material) => sum + material.count, 0);
    
    // 计算盒和组的总数量
    const totalBoxes = Math.floor(totalCount / 1728);
    const remainderAfterBoxes = totalCount % 1728;
    const totalStacks = Math.floor(remainderAfterBoxes / 64);
    const totalRemainder = remainderAfterBoxes % 64;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 总计材料信息 */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, 
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: 'primary.50',
                    border: '1px solid',
                    borderColor: 'primary.200'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LayersIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight="600" color="primary.dark">
                        总材料需求
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">
                        <strong>总方块数:</strong> {totalCount.toLocaleString()} 个
                    </Typography>
                    <Typography variant="body2">
                        <strong>换算:</strong> {totalBoxes > 0 ? `${totalBoxes} 盒 ` : ''}
                        {totalStacks > 0 ? `${totalStacks} 组 ` : ''}
                        {totalRemainder > 0 ? `${totalRemainder} 个` : ''}
                    </Typography>
                    <Typography variant="body2">
                        <strong>方块种类:</strong> {materialsWithChineseNames.length} 种
                    </Typography>
                </Box>
            </Paper>
            
            <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 1.5, px: 1 }}>
                材料清单
            </Typography>
            
            <List sx={{ 
                flexGrow: 1,
                overflowY: 'auto',
                height: '100%',
                maxHeight: '590px',
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                p: 0
            }}>
                {materialsWithChineseNames.map((material, index) => (
                    <React.Fragment key={material.blockId}>
                        {index > 0 && <Divider variant="inset" component="li" />}
                        <MaterialItem material={material} />
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default MaterialsList; 