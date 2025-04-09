import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';
import { searchSchematics } from '../services/api';

const SearchBar = ({ onSearchResults }) => {
    const [keyword, setKeyword] = useState('');

    const handleSearch = async (event) => {
        event.preventDefault();
        console.log('Searching for:', keyword);
        try {
            const results = await searchSchematics(keyword);
            console.log('Search results:', results);
            onSearchResults(results);
        } catch (error) {
            console.error('搜索失败:', error);
            alert('搜索失败: ' + error.message);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <form onSubmit={handleSearch}>
                <TextField
                    fullWidth
                    label="搜索原理图"
                    variant="outlined"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
            </form>
        </Box>
    );
};

export default SearchBar; 