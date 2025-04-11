import React, { useState, useRef } from 'react';
import { Button, Box, Typography, LinearProgress, Alert, Paper, IconButton } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Close as CloseIcon, InsertDriveFile as FileIcon } from '@mui/icons-material';
import { uploadSchematic } from '../services/api';

const FileUploader = ({ onUploadSuccess }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.litematic')) {
            setError('请上传 .litematic 文件');
            setFile(null);
            return;
        }

        setError('');
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('请选择文件');
            return;
        }

        setIsUploading(true);
        setError('');
        
        try {
            const result = await uploadSchematic(file);
            setFile(null);
            onUploadSuccess(result);
        } catch (error) {
            console.error('上传失败:', error);
            setError('上传失败: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const droppedFile = e.dataTransfer.files[0];
        if (!droppedFile) return;
        
        if (!droppedFile.name.endsWith('.litematic')) {
            setError('请上传 .litematic 文件');
            return;
        }
        
        setError('');
        setFile(droppedFile);
    };

    const clearFile = () => {
        setFile(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={() => fileInputRef.current?.click()}
            startIcon={<CloudUploadIcon />}
            sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                whiteSpace: 'nowrap',
                height: '44px',
                boxShadow: 2,
                minWidth: '150px',
                fontWeight: 500
            }}
            disabled={isUploading}
        >
            <input
                ref={fileInputRef}
                accept=".litematic"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleFileChange}
            />
            
            {file ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                        {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                    </Typography>
                    <IconButton 
                        size="small" 
                        onClick={(e) => {
                            e.stopPropagation();
                            clearFile();
                        }}
                        sx={{ ml: 0.5, p: 0.5, color: 'inherit' }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            ) : (
                '上传原理图'
            )}
            
            {file && !isUploading && (
                <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                    }}
                    sx={{ ml: 1, minWidth: 0, px: 1 }}
                >
                    开始上传
                </Button>
            )}
            
            {isUploading && (
                <LinearProgress
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        borderBottomLeftRadius: 2,
                        borderBottomRightRadius: 2
                    }}
                />
            )}
            
            {error && (
                <Alert
                    severity="error"
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        zIndex: 100
                    }}
                >
                    {error}
                </Alert>
            )}
        </Button>
    );
};

export default FileUploader; 