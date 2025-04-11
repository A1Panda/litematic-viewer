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
        <Paper 
            elevation={3} 
            sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: 3, 
                borderRadius: { xs: 1, sm: 2 },
                background: 'linear-gradient(to right, #ffffff, #f9fafb)',
                transition: 'all 0.3s ease'
            }}
            className="animate-fade-in"
        >
            <Typography variant="h6" gutterBottom fontWeight="600" color="primary.dark">
                上传原理图
            </Typography>
            
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        mb: 2,
                        borderRadius: 1,
                        '& .MuiAlert-icon': { alignItems: 'center' }
                    }}
                >
                    {error}
                </Alert>
            )}
            
            <Box 
                sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    border: isDragging 
                        ? '2px dashed #3b82f6' 
                        : '2px dashed #cbd5e1', 
                    borderRadius: { xs: 1, sm: 2 },
                    backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    mb: 2,
                    minHeight: { xs: '100px', sm: '120px' }
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
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
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        backgroundColor: '#f0f9ff',
                        p: 2,
                        borderRadius: 1,
                        width: '100%'
                    }}>
                        <FileIcon sx={{ mr: 1, color: '#3b82f6', flexShrink: 0 }} />
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                flex: 1,
                                color: '#1e40af',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                            title={file.name}
                        >
                            {file.name}
                        </Typography>
                        <IconButton 
                            size="small" 
                            onClick={(e) => {
                                e.stopPropagation();
                                clearFile();
                            }}
                            sx={{ flexShrink: 0 }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ) : (
                    <>
                        <CloudUploadIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 1 }} />
                        <Typography variant="body1" align="center" sx={{ mb: 1 }}>
                            将 .litematic 文件拖放至此处
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                            或点击选择文件
                        </Typography>
                    </>
                )}
            </Box>
            
            {isUploading && (
                <LinearProgress 
                    sx={{ 
                        mb: 2,
                        height: 6,
                        borderRadius: 3
                    }} 
                    variant="indeterminate"
                    color="primary"
                />
            )}
            
            <Button
                variant="contained"
                disabled={isUploading || !file}
                onClick={handleUpload}
                startIcon={<CloudUploadIcon />}
                sx={{ 
                    borderRadius: 2,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600
                }}
                fullWidth
            >
                {isUploading ? '上传中...' : '开始上传'}
            </Button>
        </Paper>
    );
};

export default FileUploader; 