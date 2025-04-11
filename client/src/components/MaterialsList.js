import React from 'react';
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

// 处理方块名称到图片路径的映射
const getBlockImagePath = (blockName) => {
    try {
        // 移除 minecraft: 前缀并转换为小写
        const cleanName = blockName.replace('minecraft:', '').toLowerCase();
        
        // 移除方块状态信息（如果有的话）
        const baseName = cleanName.split('[')[0];
        
        // 使用外部链接获取方块图片
        return `http://mcid.lingningyu.cn/use_mcid/img/BAI/${baseName}.png`;
    } catch (error) {
        console.error('获取方块图片路径失败:', error);
        return null;
    }
};

// 格式化方块名称，使其更易读
const formatBlockName = (blockName) => {
    if (!blockName) return '';
    // 移除 minecraft: 前缀
    let name = blockName.replace('minecraft:', '');
    
    // 处理方块状态(如果存在)
    const stateParts = name.split('[');
    if (stateParts.length > 1) {
        // 将下划线替换为空格
        name = stateParts[0].replace(/_/g, ' ');
        // 获取状态部分并格式化
        const state = stateParts[1].replace(']', '');
        return `${name} [${state}]`;
    }
    
    // 将下划线替换为空格，并首字母大写
    return name.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
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

    // 对材料按照数量进行排序
    const sortedMaterials = Object.entries(materials).sort((a, b) => b[1] - a[1]);
    
    // 计算总材料数量
    const totalCount = sortedMaterials.reduce((sum, [_, count]) => sum + count, 0);
    
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
                        <strong>方块种类:</strong> {sortedMaterials.length} 种
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
                maxHeight: '590px', // 增加最大高度
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                p: 0
            }}>
                {sortedMaterials.map(([blockName, count], index) => {
                    const imagePath = getBlockImagePath(blockName);
                    const displayName = formatBlockName(blockName);

                    // 计算盒和组的数量
                    const boxes = Math.floor(count / 1728);
                    const remainderAfterBoxes = count % 1728;
                    const stacks = Math.floor(remainderAfterBoxes / 64);
                    const remainder = remainderAfterBoxes % 64;

                    return (
                        <React.Fragment key={blockName}>
                            {index > 0 && <Divider variant="inset" component="li" />}
                            <ListItem sx={{ py: 1.5 }}>
                                <ListItemAvatar>
                                    <Avatar
                                        src={imagePath}
                                        alt={displayName}
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
                                        {displayName[0]}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Tooltip title={blockName} arrow placement="top">
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
                                                {displayName}
                                            </Typography>
                                        </Tooltip>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            <Chip
                                                size="small"
                                                label={`${count.toLocaleString()} 个`}
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
                })}
            </List>
        </Box>
    );
};

export default MaterialsList; 