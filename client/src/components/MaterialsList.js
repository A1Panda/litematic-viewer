import React from 'react';
import { List, ListItem, ListItemAvatar, ListItemText, Avatar, Typography, Box } from '@mui/material';

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

const MaterialsList = ({ materials }) => {
    if (!materials || Object.keys(materials).length === 0) {
        return (
            <Box p={2}>
                <Typography>暂无材料数据</Typography>
            </Box>
        );
    }

    // 对材料按照数量进行排序
    const sortedMaterials = Object.entries(materials).sort((a, b) => b[1] - a[1]);

    return (
        <List sx={{ 
            maxHeight: '70vh', 
            overflowY: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1
        }}>
            {sortedMaterials.map(([blockName, count]) => {
                const imagePath = getBlockImagePath(blockName);
                const displayName = blockName.replace('minecraft:', '');

                // 计算盒和组的数量
                const boxes = Math.floor(count / 1728);
                const remainderAfterBoxes = count % 1728;
                const stacks = Math.floor(remainderAfterBoxes / 64);
                const remainder = remainderAfterBoxes % 64;

                // 构建数量显示字符串
                const countDisplay = `${boxes > 0 ? `${boxes} 盒 ` : ''}${stacks > 0 ? `${stacks} 组 ` : ''}${remainder > 0 ? `${remainder} 个` : ''}`;

                return (
                    <ListItem key={blockName} divider>
                        <ListItemAvatar>
                            <Avatar
                                src={imagePath}
                                alt={displayName}
                                variant="square"
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'transparent',
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
                            primary={displayName}
                            secondary={
                                <React.Fragment>
                                    <Typography component="span" sx={{ color: 'primary.main' }}>
                                        数量: {countDisplay}
                                    </Typography>
                                    <Typography component="span" sx={{ color: 'text.secondary', marginLeft: 1 }}>
                                        (总计: {count} 个)
                                    </Typography>
                                </React.Fragment>
                            }
                            sx={{
                                '& .MuiListItemText-primary': {
                                    fontWeight: 'medium'
                                }
                            }}
                        />
                    </ListItem>
                );
            })}
        </List>
    );
};

export default MaterialsList; 