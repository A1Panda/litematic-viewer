import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, Box, CircularProgress, Typography, Button } from '@mui/material';
import { getSchematic } from '../services/api';
import MaterialsList from './MaterialsList';

const SchematicDetail = ({ open, onClose, schematicId }) => {
    const [schematic, setSchematic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imageLoadErrors, setImageLoadErrors] = useState({});

    const loadSchematicDetails = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSchematic(schematicId);
            console.log('获取到的原理图数据:', data);
            setSchematic(data);
        } catch (error) {
            console.error('加载原理图详情失败:', error);
        } finally {
            setLoading(false);
        }
    }, [schematicId]);

    useEffect(() => {
        if (open && schematicId) {
            loadSchematicDetails();
        } else {
            setSchematic(null);
            setImageLoadErrors({});
        }
    }, [open, schematicId, loadSchematicDetails]);

    const handleImageError = (viewType) => {
        console.error(`图片加载失败: ${viewType}`);
        setImageLoadErrors(prev => ({
            ...prev,
            [viewType]: true
        }));
    };

    const renderImage = (src, alt, style = {}) => {
        if (imageLoadErrors[alt]) {
            return (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 200,
                    bgcolor: 'grey.100',
                    borderRadius: 1
                }}>
                    <Typography color="text.secondary">
                        图片加载失败
                    </Typography>
                </Box>
            );
        }

        return (
            <img
                src={src}
                alt={alt}
                onError={() => handleImageError(alt)}
                style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    ...style
                }}
            />
        );
    };

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '80vh' }
            }}
        >
            <DialogTitle>
                原理图详情: {schematic?.name}
                <Button 
                    onClick={onClose} 
                    color="primary" 
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    关闭
                </Button>
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    {renderImage(schematic?.topViewPath, '俯视图')}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        {renderImage(schematic?.frontViewPath, '正视图')}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        {renderImage(schematic?.sideViewPath, '侧视图')}
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <MaterialsList materials={schematic?.materials} />
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SchematicDetail; 