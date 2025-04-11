import React, { useState } from 'react';
import { TextField, Box, Alert, InputAdornment, IconButton, Paper, CircularProgress } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { searchSchematics } from '../services/api';
import authService from '../services/auth';

const SearchBar = ({ onSearchResults }) => {
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (event) => {
        if (event) {
            event.preventDefault();
        }
        
        if (!authService.getCurrentUser()) {
            setError('请先登录');
            return;
        }

        if (!keyword.trim()) {
            // 如果关键词为空，获取全部原理图
            try {
                setIsSearching(true);
                const results = await searchSchematics('');
                onSearchResults(results);
                setError('');
            } catch (error) {
                console.error('获取原理图失败:', error);
                setError('获取原理图失败: ' + error.message);
            } finally {
                setIsSearching(false);
            }
            return;
        }

        try {
            setIsSearching(true);
            const results = await searchSchematics(keyword);
            onSearchResults(results);
            setError('');
        } catch (error) {
            console.error('搜索失败:', error);
            setError('搜索失败: ' + error.message);
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
                p: { xs: 1.5, sm: 2 }, 
                mb: 3, 
                borderRadius: { xs: 1, sm: 2 }, 
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            <form onSubmit={handleSearch}>
                <TextField
                    fullWidth
                    placeholder="搜索原理图..."
                    variant="outlined"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    disabled={!authService.getCurrentUser() || isSearching}
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
                            borderRadius: 2,
                            '& fieldset': {
                                borderColor: 'divider'
                            },
                            '&:hover fieldset': {
                                borderColor: 'primary.main'
                            }
                        }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            fontSize: '0.95rem'
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