import React, { useState } from 'react';
import { Button, Box} from '@mui/material';
import { uploadSchematic } from '../services/api';

const FileUploader = ({ onUploadSuccess }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.litematic')) {
            alert('请上传 .litematic 文件');
            return;
        }

        setIsUploading(true);
        try {
            const result = await uploadSchematic(file);
            onUploadSuccess(result);
        } catch (error) {
            alert('上传失败: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <input
                accept=".litematic"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleFileUpload}
            />
            <label htmlFor="raised-button-file">
                <Button
                    variant="contained"
                    component="span"
                    disabled={isUploading}
                >
                    {isUploading ? '上传中...' : '上传原理图'}
                </Button>
            </label>
        </Box>
    );
};

export default FileUploader; 