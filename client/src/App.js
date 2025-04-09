import React, { useState, useEffect } from 'react';
import { Container, Box } from '@mui/material';
import FileUploader from './components/FileUploader';
import SearchBar from './components/SearchBar';
import SchematicList from './components/SchematicList';
import { searchSchematics, deleteSchematic, updateSchematic } from './services/api';

function App() {
    const [schematics, setSchematics] = useState([]);

    useEffect(() => {
        loadSchematics();
    }, []);

    const loadSchematics = async () => {
        try {
            const results = await searchSchematics('');
            setSchematics(results);
        } catch (error) {
            alert('加载原理图失败: ' + error.message);
        }
    };

    const handleUploadSuccess = () => {
        loadSchematics();
    };

    const handleSearchResults = (results) => {
        setSchematics(results);
    };

    const handleDelete = async (id) => {
        if (window.confirm('确定要删除这个原理图吗？')) {
            try {
                await deleteSchematic(id);
                loadSchematics();
            } catch (error) {
                alert('删除失败: ' + error.message);
            }
        }
    };

    const handleEdit = async (schematic) => {
        const newName = prompt('请输入新的名称:', schematic.name);
        if (newName && newName !== schematic.name) {
            try {
                await updateSchematic(schematic.id, { name: newName });
                loadSchematics();
            } catch (error) {
                alert('更新失败: ' + error.message);
            }
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <FileUploader onUploadSuccess={handleUploadSuccess} />
                <SearchBar onSearchResults={handleSearchResults} />
                <SchematicList
                    schematics={schematics}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                />
            </Box>
        </Container>
    );
}

export default App; 