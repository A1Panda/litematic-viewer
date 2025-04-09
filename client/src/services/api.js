import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const BASE_URL = API_URL.replace('/api', '');

export const uploadSchematic = async (file) => {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const response = await axios.post(`${API_URL}/schematics/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const searchSchematics = async (keyword) => {
    const response = await axios.get(`${API_URL}/schematics/search`, {
        params: { keyword }
    });
    return response.data;
};

export const getSchematic = async (id) => {
    const response = await axios.get(`${API_URL}/schematics/${id}`);
    const data = response.data;
    
    // 处理图片路径
    return {
        ...data,
        frontViewPath: `${BASE_URL}${data.frontViewPath}`,
        sideViewPath: `${BASE_URL}${data.sideViewPath}`,
        topViewPath: `${BASE_URL}${data.topViewPath}`
    };
};

export const updateSchematic = async (id, data) => {
    const response = await axios.put(`${API_URL}/schematics/${id}`, data);
    return response.data;
};

export const deleteSchematic = async (id) => {
    const response = await axios.delete(`${API_URL}/schematics/${id}`);
    return response.data;
};

export const downloadSchematic = async (id, name) => {
    try {
        const response = await axios.get(`${API_URL}/schematics/${id}/download`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${name}.litematic`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('下载失败:', error);
        throw error;
    }
};

export const getSchematicViews = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/schematics/${id}`);
        const data = response.data;
        return {
            ...data,
            frontViewPath: `${API_URL.replace('/api', '')}${data.frontViewPath}`,
            sideViewPath: `${API_URL.replace('/api', '')}${data.sideViewPath}`,
            topViewPath: `${API_URL.replace('/api', '')}${data.topViewPath}`
        };
    } catch (error) {
        console.error('获取视图失败:', error);
        throw error;
    }
}; 