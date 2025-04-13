import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    Grid, 
    Box, 
    CircularProgress, 
    Typography, 
    Button, 
    Alert,
    Divider,
    Paper,
    Chip,
    IconButton,
    Tooltip,
    Fade,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { 
    Download as DownloadIcon, 
    Close as CloseIcon,
    ZoomIn as ZoomInIcon,
    Public as PublicIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    AccessTime as AccessTimeIcon,
    ViewInAr as ViewInArIcon
} from '@mui/icons-material';
import { getSchematic, downloadSchematic, getViewBlob, getLitematicFile } from '../services/api';
import MaterialsList from './MaterialsList';

const SchematicDetail = ({ open, onClose, schematicId }) => {
    const [schematic, setSchematic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [views, setViews] = useState({ top: null, side: null, front: null });
    const [viewsLoading, setViewsLoading] = useState(false);
    const [viewErrors, setViewErrors] = useState({});
    const [error, setError] = useState(null);
    const [enlargedView, setEnlargedView] = useState(null);
    const [show3DPreview, setShow3DPreview] = useState(false);
    const [viewerUrl, setViewerUrl] = useState('');
    const [loading3D, setLoading3D] = useState(false);
    const [error3D, setError3D] = useState(null);
    const iframeRef = useRef(null);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const loadSchematicDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSchematic(schematicId);
            console.log('获取到的原理图数据:', data);
            setSchematic(data);
            
            // 加载视图
            await loadViews(schematicId);
        } catch (error) {
            console.error('加载原理图详情失败:', error);
            setError('加载原理图详情失败: ' + (error.message || '未知错误'));
        } finally {
            setLoading(false);
        }
    }, [schematicId]);

    // 加载三视图的函数
    const loadViews = async (id) => {
        setViewsLoading(true);
        setViewErrors({});
        try {
            console.log('开始加载原理图视图...');
            
            // 并行请求三视图
            const [topView, sideView, frontView] = await Promise.all([
                getViewBlob(id, 'top-view'),
                getViewBlob(id, 'side-view'),
                getViewBlob(id, 'front-view')
            ]);
            
            setViews({
                top: topView,
                side: sideView,
                front: frontView
            });
            
            console.log('视图加载完成');
        } catch (error) {
            console.error('加载视图失败:', error);
            setViewErrors({ general: '加载视图失败: ' + (error.message || '未知错误') });
        } finally {
            setViewsLoading(false);
        }
    };

    useEffect(() => {
        if (open && schematicId) {
            loadSchematicDetails();
        } else {
            setSchematic(null);
            setViews({ top: null, side: null, front: null });
            setViewErrors({});
            setError(null);
        }
    }, [open, schematicId, loadSchematicDetails]);

    const handleDownload = async () => {
        if (!schematic) return;
        
        try {
            await downloadSchematic(schematic.id, schematic.name);
        } catch (error) {
            console.error('下载原理图失败:', error);
            alert('下载原理图失败: ' + (error.message || '未知错误'));
        }
    };

    // 处理3D预览按钮点击
    const handle3DPreviewClick = async () => {
        if (!schematic) return;
        
        try {
            setShow3DPreview(true);
            setLoading3D(true);
            setError3D(null);
            
            // 构建基础URL，确保在各种环境下都能找到正确路径
            const baseUrl = process.env.NODE_ENV === 'development' 
                ? window.location.origin 
                : process.env.PUBLIC_URL || window.location.origin;
            
            console.log('设置3D预览URL，baseUrl:', baseUrl);
            // 设置iframe URL，确保在生产环境也能找到
            setViewerUrl(`${baseUrl}/litematic-viewer/index.html?t=${Date.now()}`);
            console.log('完整iframe URL:', `${baseUrl}/litematic-viewer/index.html?t=${Date.now()}`);
        } catch (error) {
            console.error('设置3D预览URL失败:', error);
            setError3D('准备3D预览失败: ' + (error.message || '未知错误'));
            setLoading3D(false);
        }
    };

    // 关闭3D预览
    const close3DPreview = () => {
        setShow3DPreview(false);
        setViewerUrl('');
        setLoading3D(false);
        setError3D(null);
        // 如果iframe引用存在，清除其内容
        if (iframeRef.current) {
            try {
                // 尝试调用iframe中的卸载函数（如果存在）
                const iframeWindow = iframeRef.current.contentWindow;
                if (iframeWindow && typeof iframeWindow.unloadSchematic === 'function') {
                    iframeWindow.unloadSchematic();
                }
            } catch (error) {
                console.warn('清理iframe内容时出错:', error);
            }
        }
    };

    // 在iframe加载完成后处理文件加载
    const handleIframeLoad = async () => {
        if (!schematic || !iframeRef.current) return;
        
        try {
            console.log('iframe加载完成，开始获取litematic文件');
            setLoading3D(true);
            // 获取文件对象
            const file = await getLitematicFile(schematic.id);
            if (!file) {
                throw new Error('获取litematic文件失败');
            }
            
            console.log('成功获取litematic文件:', file.name, file.size);
            
            // 获取iframe的contentWindow
            const iframe = iframeRef.current;
            const iframeWindow = iframe.contentWindow;
            
            // 调用iframe中的方法处理文件
            if (iframeWindow && typeof iframeWindow.loadAndProcessFile === 'function') {
                console.log('调用iframe中的loadAndProcessFile方法');
                iframeWindow.loadAndProcessFile(file);
                setLoading3D(false);
            } else {
                throw new Error('iframe中没有找到loadAndProcessFile方法');
            }
        } catch (error) {
            console.error('处理litematic文件失败:', error);
            setError3D('加载3D模型失败: ' + (error.message || '未知错误'));
            setLoading3D(false);
        }
    };

    const renderImage = (src, alt, viewType) => {
        if (!src) {
            return (
                <Paper 
                    elevation={1}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 200,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        border: '1px dashed #ccc'
                    }}
                >
                    <Typography color="text.secondary">
                        {alt}不可用
                    </Typography>
                </Paper>
            );
        }

        return (
            <Paper 
                elevation={2}
                sx={{
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        transform: 'scale(1.01)'
                    },
                    '&:hover .zoom-icon': {
                        opacity: 1
                    }
                }}
            >
                <img
                    src={src}
                    alt={alt}
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                    }}
                />
                <Box 
                    className="zoom-icon"
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                    }}
                >
                    <Tooltip title="放大查看">
                        <IconButton 
                            size="small" 
                            sx={{ 
                                bgcolor: 'rgba(255,255,255,0.8)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setEnlargedView({ src, alt });
                            }}
                        >
                            <ZoomInIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: { 
                    minHeight: isMobile ? '100%' : '80vh',
                    borderRadius: isMobile ? 0 : 3,
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    margin: isMobile ? 0 : undefined
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: { xs: 2, sm: 3 },
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 'calc(100% - 120px)' }}>
                    <Typography 
                        variant="subtitle1" 
                        fontWeight="600"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: { xs: '1.1rem', sm: '1.5rem' }
                        }}
                        title={schematic?.name}
                    >
                        {schematic?.name}
                    </Typography>
                    {schematic && (
                        <Chip 
                            icon={schematic?.is_public ? <PublicIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                            label={schematic?.is_public ? "公开" : "私有"}
                            color={schematic?.is_public ? "default" : "primary"}
                            size="small"
                            sx={{ height: 26, flexShrink: 0 }}
                        />
                    )}
                </Box>
                <Box>
                    {schematic && (
                        <>
                            <Button 
                                onClick={handle3DPreviewClick} 
                                color="secondary" 
                                variant="outlined"
                                size="small"
                                startIcon={<ViewInArIcon />}
                                sx={{ mr: 1 }}
                            >
                                3D预览
                            </Button>
                            <Button 
                                onClick={handleDownload} 
                                color="primary" 
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadIcon />}
                                sx={{ mr: 1 }}
                            >
                                下载
                            </Button>
                        </>
                    )}
                    <IconButton 
                        onClick={onClose}
                        size="small"
                        sx={{ 
                            bgcolor: 'grey.100',
                            '&:hover': { bgcolor: 'grey.200' }
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                ) : schematic && (
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                        <Grid item xs={12} md={8}>
                            {/* 原理图创建者和时间信息 */}
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: 2, 
                                    mb: 3, 
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 3
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="body2">
                                        上传者: <strong>{schematic.creator_name}</strong>
                                    </Typography>
                                </Box>
                                
                                {schematic.created_at && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="body2">
                                            上传于: {formatDate(schematic.created_at)}
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                            
                            <Typography 
                                variant="subtitle1" 
                                gutterBottom 
                                fontWeight="600"
                                sx={{ mb: 2 }}
                            >
                                三视图
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
                                <Box>
                                    <Typography 
                                        variant="subtitle1" 
                                        gutterBottom 
                                        fontWeight="500"
                                        sx={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 1.5,
                                            '&:after': {
                                                content: '""',
                                                display: 'block',
                                                height: '1px',
                                                bgcolor: 'divider',
                                                flexGrow: 1,
                                                ml: 1
                                            }
                                        }}
                                    >
                                        俯视图
                                    </Typography>
                                    {viewsLoading ? 
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                            <CircularProgress size={30} />
                                        </Box> 
                                        : renderImage(views.top, '俯视图', 'top')}
                                </Box>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography 
                                            variant="subtitle1" 
                                            gutterBottom 
                                            fontWeight="500"
                                            sx={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 1.5,
                                                '&:after': {
                                                    content: '""',
                                                    display: 'block',
                                                    height: '1px',
                                                    bgcolor: 'divider',
                                                    flexGrow: 1,
                                                    ml: 1
                                                }
                                            }}
                                        >
                                            正视图
                                        </Typography>
                                        {viewsLoading ? 
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                                <CircularProgress size={30} />
                                            </Box> 
                                            : renderImage(views.front, '正视图', 'front')}
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography 
                                            variant="subtitle1" 
                                            gutterBottom 
                                            fontWeight="500"
                                            sx={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                mb: 1.5,
                                                '&:after': {
                                                    content: '""',
                                                    display: 'block',
                                                    height: '1px',
                                                    bgcolor: 'divider',
                                                    flexGrow: 1,
                                                    ml: 1
                                                }
                                            }}
                                        >
                                            侧视图
                                        </Typography>
                                        {viewsLoading ? 
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                                <CircularProgress size={30} />
                                            </Box> 
                                            : renderImage(views.side, '侧视图', 'side')}
                                    </Grid>
                                </Grid>
                                
                                {viewErrors.general && (
                                    <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{viewErrors.general}</Alert>
                                )}
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Paper 
                                elevation={2} 
                                sx={{ 
                                    p: 2, 
                                    borderRadius: 2,
                                    height: { xs: '100%', md: 'auto' },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    maxHeight: { md: '860px' },
                                    alignSelf: 'flex-start'
                                }}
                            >
                                <Typography 
                                    variant="subtitle1" 
                                    gutterBottom 
                                    fontWeight="600"
                                    sx={{ 
                                        pb: 1.5,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    材料列表
                                </Typography>
                                <Box sx={{ 
                                    flexGrow: 1, 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden'
                                }}>
                                    <MaterialsList materials={schematic?.materials} />
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            
            {/* 图像放大查看对话框 */}
            <Dialog 
                open={!!enlargedView} 
                onClose={() => setEnlargedView(null)}
                maxWidth="xl"
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogContent sx={{ p: 1, position: 'relative' }}>
                    {enlargedView && (
                        <Fade in={!!enlargedView}>
                            <Box>
                                <IconButton 
                                    sx={{ 
                                        position: 'absolute', 
                                        top: 8, 
                                        right: 8, 
                                        bgcolor: 'rgba(255,255,255,0.8)',
                                        zIndex: 1,
                                        '&:hover': { bgcolor: 'white' }
                                    }}
                                    onClick={() => setEnlargedView(null)}
                                >
                                    <CloseIcon />
                                </IconButton>
                                <img 
                                    src={enlargedView.src} 
                                    alt={enlargedView.alt}
                                    style={{ 
                                        maxWidth: '100%',
                                        maxHeight: '80vh', 
                                        display: 'block'
                                    }} 
                                />
                            </Box>
                        </Fade>
                    )}
                </DialogContent>
            </Dialog>
            
            {/* 3D预览对话框 - 使用iframe嵌入现有的litematic-viewer */}
            <Dialog
                open={show3DPreview}
                onClose={close3DPreview}
                maxWidth="xl"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: { 
                        minHeight: '90vh', 
                        maxHeight: '90vh',
                        borderRadius: isMobile ? 0 : 2
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="subtitle1">
                        {schematic?.name} - 3D预览
                    </Typography>
                    <IconButton onClick={close3DPreview} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
                    {error3D ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="500px" flexDirection="column">
                            <Alert severity="error" sx={{ mb: 2 }}>{error3D}</Alert>
                            <Button 
                                variant="outlined" 
                                color="primary" 
                                onClick={() => {
                                    setError3D(null);
                                    handle3DPreviewClick();
                                }}
                            >
                                重试
                            </Button>
                        </Box>
                    ) : viewerUrl ? (
                        <>
                            {loading3D && (
                                <Box 
                                    display="flex" 
                                    justifyContent="center" 
                                    alignItems="center" 
                                    position="absolute" 
                                    zIndex={10}
                                    width="100%"
                                    height="100%"
                                    bgcolor="rgba(0,0,0,0.5)"
                                >
                                    <CircularProgress sx={{ color: 'white' }} />
                                    <Typography sx={{ ml: 2, color: 'white' }}>加载3D模型中...</Typography>
                                </Box>
                            )}
                            <iframe 
                                ref={iframeRef}
                                src={viewerUrl}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    minHeight: '80vh'
                                }}
                                title="Litematic 3D Viewer"
                                allow="fullscreen"
                                onLoad={handleIframeLoad}
                            />
                        </>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="500px">
                            <CircularProgress />
                            <Typography sx={{ ml: 2 }}>加载3D预览...</Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Dialog>
    );
};

export default SchematicDetail; 