import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, CircularProgress, Chip, Avatar } from '@mui/material';
import FileUploader from '../components/FileUploader';
import SearchBar from '../components/SearchBar';
import SchematicList from '../components/SchematicList';
import UserInfo from '../components/UserInfo';
import { searchSchematics, deleteSchematic, updateSchematic } from '../services/api';
import authService from '../services/auth';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const HomePage = ({ user: propUser, isGuestMode, onExitGuestMode }) => {
    const [schematics, setSchematics] = useState([]);
    const [filteredSchematics, setFilteredSchematics] = useState([]);
    const [activeTab, setActiveTab] = useState(0); // 0=所有原理图，1=我的原理图
    const [user, setUser] = useState(propUser || authService.getCurrentUser());
    const [editDialog, setEditDialog] = useState({ open: false, schematic: null });
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);

    // 注册全局编辑方法
    useEffect(() => {
        window.openSchematicEditor = (schematic) => {
            console.log('全局编辑方法被调用，原理图:', schematic);
            if (schematic) {
                setEditDialog({ open: true, schematic });
                setEditName(schematic.name || '');
            }
        };
        
        return () => {
            delete window.openSchematicEditor;
        };
    }, []);

    // 当传入的user属性变化时，更新本地状态
    useEffect(() => {
        if (propUser) {
            setUser(propUser);
        }
    }, [propUser]);

    useEffect(() => {
        // 游客模式或已登录用户都需要加载原理图
        if (user || isGuestMode) {
            loadSchematics();
            if (user) {
                console.log('当前用户信息:', user);
            } else {
                console.log('游客模式加载原理图');
            }
        }
    }, [user, isGuestMode]);

    // 当schematics或activeTab发生变化时，过滤显示的原理图
    useEffect(() => {
        if (!user) {
            // 游客模式或未登录用户只显示公开原理图
            if (isGuestMode) {
                const publicSchematics = schematics.filter(s => s.is_public === 1);
                setFilteredSchematics(publicSchematics);
                console.log(`游客模式: 显示${publicSchematics.length}个公开原理图`);
            } else {
                setFilteredSchematics([]);
            }
            return;
        }

        if (!schematics.length) {
            setFilteredSchematics([]);
            return;
        }

        console.log('正在过滤原理图，原理图总数:', schematics.length);
        console.log('用户ID:', user.id, '用户角色:', user.role);
        
        // 筛选出用户可以查看的所有原理图
        const visibleSchematics = schematics.filter(schematic => {
            const isOwner = schematic.user_id === user.id;
            const isPublic = schematic.is_public === 1;
            const isAdmin = user.role === 'admin';
            
            return isPublic || isOwner || isAdmin;
        });
        
        console.log(`可见原理图数量: ${visibleSchematics.length}/${schematics.length}`);

        if (activeTab === 0) { 
            // 所有原理图 - 包括所有公开的以及自己的私有原理图
            setFilteredSchematics(visibleSchematics);
            console.log(`显示所有可见原理图，共 ${visibleSchematics.length} 个`);
        } else { 
            // 我的原理图 - 只显示当前用户创建的原理图
            const mySchematic = schematics.filter(s => s.user_id === user.id);
            setFilteredSchematics(mySchematic);
            console.log(`显示我的原理图，共 ${mySchematic.length} 个，我的用户ID：${user.id}`);
        }
    }, [schematics, activeTab, user, isGuestMode]);

    const loadSchematics = async (searchTerm = '', showOwnOnly = false) => {
        try {
            setLoading(true);
            
            // 搜索参数
            let params = '';
            if (searchTerm && typeof searchTerm === 'string') {
                params = `?q=${encodeURIComponent(searchTerm)}`;
            }
            
            // 用户相关过滤，确保通过URL参数而不是对象传递
            if (showOwnOnly && user) {
                params += params ? `&userId=${user.id}` : `?userId=${user.id}`;
                console.log(`正在加载用户ID=${user.id}的原理图，参数:${params}`);
            }
            
            console.log('搜索URL参数:', params);
            const schematicsList = await searchSchematics(params);
            
            console.log('原理图总数:', schematicsList.length);
            if (user) {
                console.log('用户ID:', user.id, '用户角色:', user.role);
            } else if (isGuestMode) {
                console.log('游客模式：仅显示公开原理图');
            }
            
            // 过滤掉私有原理图（如果不是管理员或所有者）
            const visibleSchematics = schematicsList.filter(schematic => {
                // 管理员可以看到所有原理图
                if (user && user.role === 'admin') return true;
                
                // 用户可以看到自己的原理图和公开的原理图
                if (user && user.id === schematic.user_id) return true;
                
                // 游客和普通用户只能看到公开的原理图
                return schematic.is_public === 1;
            });
            
            console.log('可见原理图数量:', visibleSchematics.length + '/' + schematicsList.length);
            
            setSchematics(visibleSchematics);
            
            // 如果当前是"我的原理图"标签，则只显示自己的原理图
            if (activeTab === 1 && user) {
                const mySchematic = visibleSchematics.filter(s => s.user_id === user.id);
                setFilteredSchematics(mySchematic);
                console.log(`设置"我的原理图"，共 ${mySchematic.length} 个`);
            } else {
                setFilteredSchematics(visibleSchematics);
                console.log(`设置"所有原理图"，共 ${visibleSchematics.length} 个`);
            }
        } catch (error) {
            console.error('加载原理图失败:', error);
            alert('加载原理图失败: ' + (error.message || '未知错误'));
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        console.log('上传成功，重新加载原理图列表');
        loadSchematics();
    };

    const handleSearchResults = (results) => {
        console.log(`搜索返回 ${results.length} 个结果`);
        setSchematics(results);
    };

    // 处理搜索
    const handleSearch = (searchTerm) => {
        console.log(`正在搜索: "${searchTerm}"`);
        // 根据当前标签页决定是否只搜索自己的原理图
        if (activeTab === 1 && user) {
            loadSchematics(searchTerm, true); // 搜索我的原理图
        } else {
            loadSchematics(searchTerm, false); // 搜索所有原理图
        }
    };

    const handleLogout = () => {
        authService.logout();
        setUser(null);
        // 如果需要，可以在这里添加重定向到登录页面的逻辑
        window.location.href = '/';
    };

    // 处理删除原理图
    const handleDeleteSchematic = async (id) => {
        if (!window.confirm('确定要删除这个原理图吗？')) {
            return;
        }

        try {
            await deleteSchematic(id);
            // 刷新列表
            loadSchematics();
        } catch (error) {
            console.error('删除原理图失败:', error);
            alert('删除失败: ' + (error.message || '未知错误'));
        }
    };

    // 打开编辑对话框
    const handleEditSchematic = (schematic) => {
        console.log('编辑或更新原理图:', schematic);
        
        if (!schematic) {
            console.error('接收到无效的原理图对象');
            return;
        }
        
        // 如果是编辑按钮点击（没有is_public属性）
        if (!schematic.hasOwnProperty('is_public')) {
            console.log('编辑按钮点击 - 打开编辑对话框');
            // 直接打开编辑对话框
            console.log('设置对话框状态为打开，原理图ID:', schematic.id);
            setEditDialog({ open: true, schematic });
            setEditName(schematic.name || '');
            
            // 确认对话框状态
            setTimeout(() => {
                console.log('对话框状态:', editDialog.open ? '已打开' : '未打开');
            }, 100);
            return;
        }
        
        // 处理可见性切换
        if (schematic && schematic.id) {
            console.log('处理可见性切换或其他更新');
            // 查找并更新本地数据
            const updatedSchematics = schematics.map(s => 
                s.id === schematic.id ? {...s, ...schematic} : s
            );
            setSchematics(updatedSchematics);
        }
    };

    // 关闭编辑对话框
    const handleCloseEditDialog = () => {
        console.log('关闭编辑对话框');
        setEditDialog({ open: false, schematic: null });
    };

    // 保存编辑
    const handleSaveEdit = async () => {
        try {
            if (!editDialog.schematic) return;
            
            await updateSchematic(editDialog.schematic.id, { name: editName });
            handleCloseEditDialog();
            // 刷新列表
            loadSchematics();
        } catch (error) {
            console.error('更新原理图失败:', error);
            alert('更新失败: ' + (error.message || '未知错误'));
        }
    };

    // 切换标签页
    const handleTabChange = (event, newValue) => {
        console.log(`切换到标签页: ${newValue === 0 ? '所有原理图' : '我的原理图'}`);
        setActiveTab(newValue);
        
        // 标签页切换时重新加载对应数据
        if (newValue === 1 && user) {
            // 切换到"我的原理图"，加载当前用户的原理图
            console.log(`加载用户ID=${user.id}的原理图`);
            loadSchematics('', true);
        } else {
            // 切换到"所有原理图"，加载所有可见原理图
            loadSchematics('', false);
        }
    };

    return (
        <Container 
            maxWidth={false} 
            sx={{ 
                px: { xs: 2, sm: 3, md: 4 },
                pt: { xs: 3, sm: 4 },
                pb: 6,
                maxWidth: '100%',
                mx: 'auto',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #f0f8ff 0%, #f5f5f5 100%)',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* 顶部标题栏 */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    pb: 1.5,
                    pt: 1.5,
                    borderRadius: 3,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    width: '100%'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}
                >
                    <Avatar
                        sx={{
                            width: 38,
                            height: 38,
                            bgcolor: 'primary.main',
                            boxShadow: 1,
                            border: '1px solid white'
                        }}
                    >
                        <VpnKeyIcon sx={{ color: 'white', fontSize: '1.4rem' }} />
                    </Avatar>
                    <Typography
                        variant="h6"
                        component="h1"
                        fontWeight="600"
                        color="primary.main"
                        sx={{
                            textShadow: '0 1px 1px rgba(0, 0, 0, 0.05)',
                            letterSpacing: '0.3px'
                        }}
                    >
                        Minecraft原理图管理系统
                    </Typography>
                </Box>
            </Box>

            {/* 重构顶部布局为三栏结构 - 已去掉登录按钮 */}
            <Box 
                sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: { xs: 2, sm: 3 },
                    mb: 4,
                    mt: 0,
                    width: '100%',
                    background: 'white',
                    borderRadius: 3,
                    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.05)',
                    p: { xs: 2, sm: 2.5 }
                }}
            >
                {/* 左侧用户信息 */}
                <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    width: { xs: '100%', sm: 'auto' },
                }}>
                    <UserInfo 
                        user={user}
                        onLogout={() => {
                            if (isGuestMode && onExitGuestMode) {
                                onExitGuestMode();
                            } else {
                                setUser(null);
                                setSchematics([]);
                                setFilteredSchematics([]);
                            }
                        }}
                        isGuestMode={isGuestMode}
                    />
                </Box>
                
                {/* 中间搜索栏 */}
                {(user || isGuestMode) && (
                    <Box sx={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        flexGrow: 1,
                        maxWidth: { xs: '100%', sm: '600px', md: '800px' }
                    }}>
                        <SearchBar onSearch={handleSearch} />
                    </Box>
                )}
                
                {/* 右侧上传按钮 */}
                {user && !isGuestMode && (
                    <Box sx={{ 
                        display: { xs: 'none', md: 'flex' },
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        width: { xs: '100%', sm: 'auto' },
                    }}>
                        <FileUploader onUploadSuccess={handleUploadSuccess} />
                    </Box>
                )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {(user || isGuestMode) ? (
                    <>
                        <Box sx={{ 
                            borderBottom: 1, 
                            borderColor: 'divider',
                            mb: 3,
                            mt: 1,
                            width: '100%'
                        }}>
                            <Tabs 
                                value={activeTab} 
                                onChange={handleTabChange}
                                sx={{ 
                                    '& .MuiTab-root': { 
                                        px: { xs: 2, sm: 3 },
                                        py: 1.5,
                                        fontWeight: 500
                                    },
                                    width: '100%'
                                }}
                            >
                                <Tab 
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span>所有原理图</span>
                                            {filteredSchematics.length > 0 && (
                                                <Chip 
                                                    label={filteredSchematics.length} 
                                                    size="small" 
                                                    color="primary" 
                                                    sx={{ height: 20, minWidth: 20 }}
                                                />
                                            )}
                                        </Box>
                                    } 
                                />
                                {user && !isGuestMode && (
                                    <Tab 
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span>我的原理图</span>
                                            </Box>
                                        } 
                                    />
                                )}
                            </Tabs>
                        </Box>
                        
                        {user && !isGuestMode && activeTab === 1 && (
                            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                                <FileUploader onUploadSuccess={handleUploadSuccess} />
                            </Box>
                        )}
                        
                        <Box sx={{ mt: 2, position: 'relative', minHeight: '200px', width: '100%' }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                                    <CircularProgress />
                                </Box>
                            ) : filteredSchematics.length > 0 ? (
                                <SchematicList
                                    schematics={filteredSchematics}
                                    currentUser={user}
                                    onDelete={handleDeleteSchematic}
                                    onEdit={handleEditSchematic}
                                />
                            ) : (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        {activeTab === 0 ? '暂无原理图' : '您还没有上传任何原理图'}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        
                        {/* 编辑对话框 */}
                        <Dialog
                            open={editDialog.open}
                            onClose={handleCloseEditDialog}
                            maxWidth="sm"
                            fullWidth
                        >
                            <DialogTitle>编辑原理图</DialogTitle>
                            <DialogContent>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    label="原理图名称"
                                    fullWidth
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseEditDialog}>取消</Button>
                                <Button onClick={handleSaveEdit} color="primary" variant="contained">保存</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                ) : (
                    <Box sx={{ 
                        textAlign: 'center', 
                        mt: 5, 
                        mb: 4,
                        p: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '5px',
                            background: 'linear-gradient(to right, #2196f3, #64b5f6)',
                            borderTopLeftRadius: '4px',
                            borderTopRightRadius: '4px'
                        }
                    }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: 'primary.main',
                                mb: 3,
                                boxShadow: 2
                            }}
                        >
                            <VpnKeyIcon sx={{ fontSize: '2.5rem', color: 'white' }} />
                        </Avatar>
                        
                        <Typography
                            variant="h4"
                            gutterBottom
                            fontWeight="700"
                            color="primary.main"
                            sx={{ mb: 2 }}
                        >
                            欢迎使用Minecraft原理图管理系统
                        </Typography>
                        
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mb: 4, maxWidth: 600, lineHeight: 1.6 }}
                        >
                            该系统可以帮助您上传、管理和分享您的Minecraft原理图，便于团队协作和项目管理。登录后即可体验完整功能。
                        </Typography>
                        
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                width: '100%',
                                maxWidth: 400,
                                justifyContent: 'center'
                            }}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                href="/login"
                                sx={{
                                    px: 4,
                                    py: 1.2,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)'
                                    }
                                }}
                            >
                                登录账号
                            </Button>
                            
                            <Button
                                variant="outlined"
                                color="secondary"
                                size="large"
                                onClick={() => {
                                    // 在浏览器环境下直接调用App.js中的enterGuestMode函数
                                    try {
                                        console.log('尝试进入游客模式');
                                        if (window.enterGuestMode) {
                                            window.enterGuestMode();
                                        } else {
                                            // 回退方案：直接修改URL
                                            window.location.href = '/?guest=true';
                                        }
                                    } catch (error) {
                                        console.error('进入游客模式失败', error);
                                        // 回退方案：直接修改URL
                                        window.location.href = '/?guest=true';
                                    }
                                }}
                                sx={{
                                    px: 4,
                                    py: 1.2,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                                    }
                                }}
                            >
                                游客浏览
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default HomePage; 