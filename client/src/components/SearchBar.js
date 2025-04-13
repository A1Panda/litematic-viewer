import React, { useState } from 'react';
import { TextField, Alert, InputAdornment, IconButton, Paper, CircularProgress } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { searchSchematics } from '../services/api';
import authService from '../services/auth';

const SearchBar = ({ onSearchResults, onSearch }) => {
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (event) => {
        if (event) {
            event.preventDefault();
        }
        
        // 清理关键词
        const searchTerm = keyword.trim();
        
        // 如果提供了新的onSearch回调，优先使用它
        if (onSearch) {
            console.log('使用onSearch回调进行搜索:', searchTerm);
            onSearch(searchTerm);
            return;
        }
        
        // 保留原来的搜索逻辑做为兼容性措施
        if (!authService.getCurrentUser()) {
            setError('请先登录');
            return;
        }

        try {
            setIsSearching(true);
            setError('');
            
            // 直接使用原始字符串进行搜索
            const results = await searchSchematics(searchTerm);
            console.log(`搜索返回 ${results.length} 个结果`);
            
            if (onSearchResults) {
                onSearchResults(results);
            }
        } catch (error) {
            console.error('搜索失败:', error);
            setError('搜索失败: ' + (error.message || '未知错误'));
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setKeyword('');
        // 触发空搜索，获取所有原理图
        handleSearch();
    };

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 0,
                borderRadius: 2, 
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                width: '100%',
                maxWidth: '100%',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden'
            }}
        >
            <form onSubmit={handleSearch} style={{ width: '100%', height: '100%' }}>
                <TextField
                    fullWidth
                    placeholder="搜索原理图..."
                    variant="outlined"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    disabled={isSearching}
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                {isSearching ? (
                                    <CircularProgress size={20} color="primary" />
                                ) : keyword ? (
                                    <IconButton
                                        aria-label="清除搜索"
                                        onClick={clearSearch}
                                        edge="end"
                                        size="small"
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                ) : null}
                            </InputAdornment>
                        ),
                        sx: {
                            height: '40px',
                            borderRadius: 2,
                            px: 1,
                            '& fieldset': {
                                border: 'none'
                            },
                            '&:hover fieldset': {
                                border: 'none'
                            },
                            '&.Mui-focused fieldset': {
                                border: 'none'
                            }
                        }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            fontSize: '0.95rem',
                            height: '40px'
                        },
                        '& .MuiInputBase-root': {
                            backgroundColor: 'transparent'
                        }
                    }}
                />
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            mt: 2,
                            borderRadius: 1
                        }}
                    >
                        {error}
                    </Alert>
                )}
            </form>
        </Paper>
    );
};

export default SearchBar; 