import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, CircularProgress, Chip } from '@mui/material';
import FileUploader from '../components/FileUploader';
import SearchBar from '../components/SearchBar';
import SchematicList from '../components/SchematicList';
import UserInfo from '../components/UserInfo';
import { searchSchematics, deleteSchematic, updateSchematic } from '../services/api';
import authService from '../services/auth';

const HomePage = ({ user: propUser }) => {
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
        if (user) {
            loadSchematics();
            console.log('当前用户信息:', user);
        }
    }, [user]);

    // 当schematics或activeTab发生变化时，过滤显示的原理图
    useEffect(() => {
        if (!user || !schematics.length) {
            setFilteredSchematics([]);
            return;
        }

        console.log('正在过滤原理图，原理图总数:', schematics.length);
        console.log('用户ID:', user.id, '用户角色:', user.role);
        
        // 这里我们需要创建一个新数组，包含用户有权查看的原理图
        // 规则：1. 所有公开的原理图 2. 用户自己的原理图(无论公开与否) 3. 如果是管理员，则所有原理图
        const visibleSchematics = schematics.filter(schematic => {
            const isOwner = schematic.user_id === user.id;
            const isPublic = schematic.is_public;
            const isAdmin = user.role === 'admin';
            
            // 记录原理图的筛选条件
            const shouldShow = isPublic || isOwner || isAdmin;
            if (!shouldShow) {
                console.log(`原理图 ${schematic.id}(${schematic.name}) 已过滤，因为它是私有的且不属于当前用户`);
            }
            return shouldShow;
        });
        
        console.log(`可见原理图数量: ${visibleSchematics.length}/${schematics.length}`);

        if (activeTab === 0) { // 所有原理图 - 包括所有公开的以及自己的私有原理图
            setFilteredSchematics(visibleSchematics);
            console.log(`显示所有可见原理图，共 ${visibleSchematics.length} 个`);
        } else { // 我的原理图 - 只显示当前用户创建的原理图
            const mySchematic = visibleSchematics.filter(s => s.user_id === user.id);
            setFilteredSchematics(mySchematic);
            console.log(`显示我的原理图，共 ${mySchematic.length} 个`);
        }
    }, [schematics, activeTab, user]);

    const loadSchematics = async () => {
        try {
            setLoading(true);
            console.log('加载原理图列表...');
            const results = await searchSchematics('');
            console.log(`加载了 ${results.length} 个原理图`);
            setSchematics(results);
        } catch (error) {
            console.error('加载原理图失败:', error);
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
    };

    return (
        <Container 
            maxWidth={false} 
            sx={{ 
                px: { xs: 2, sm: 3, md: 4 },
                maxWidth: { sm: '100%', md: '1200px' },
                mx: 'auto',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ 
                my: { xs: 2, sm: 3, md: 4 },
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1
            }}>
                <UserInfo user={user} onLogout={handleLogout} />
                
                {user ? (
                    <>
                        <FileUploader onUploadSuccess={handleUploadSuccess} />
                        <SearchBar onSearchResults={handleSearchResults} />
                        
                        <Box sx={{ 
                            mt: 2, 
                            borderBottom: 1, 
                            borderColor: 'divider',
                            overflowX: 'auto'
                        }}>
                            <Tabs value={activeTab} onChange={handleTabChange}>
                                <Tab 
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography sx={{ mr: 0.5 }}>所有原理图</Typography>
                                            <Chip 
                                                label={schematics.length} 
                                                size="small" 
                                                sx={{ 
                                                    height: 20, 
                                                    minWidth: 20, 
                                                    fontSize: '0.75rem' 
                                                }} 
                                            />
                                        </Box>
                                    } 
                                />
                                <Tab 
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography sx={{ mr: 0.5 }}>我的原理图</Typography>
                                            <Chip 
                                                label={schematics.filter(s => s.user_id === user.id).length} 
                                                size="small" 
                                                sx={{ 
                                                    height: 20, 
                                                    minWidth: 20, 
                                                    fontSize: '0.75rem' 
                                                }} 
                                            />
                                        </Box>
                                    } 
                                />
                            </Tabs>
                        </Box>
                        
                        <Box sx={{ mt: 2, position: 'relative', minHeight: '200px' }}>
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
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            请登录后继续
                        </Typography>
                        <Button 
                            variant="contained" 
                            color="primary"
                            onClick={() => window.location.href = '/login'}
                        >
                            去登录
                        </Button>
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default HomePage; 