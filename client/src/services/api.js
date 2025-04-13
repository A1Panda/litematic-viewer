import axios from 'axios';
import authService from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
// eslint-disable-next-line no-unused-vars
const BASE_URL = API_URL.replace('/api', '');

// 创建带有认证拦截器的 axios 实例
const api = axios.create({
    baseURL: API_URL
});

// 添加请求拦截器
api.interceptors.request.use(
    (config) => {
        const user = authService.getCurrentUser();
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const uploadSchematic = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/schematics/upload', formData);
    return response.data;
};

export const searchSchematics = async (query = '') => {
    // 这里处理不同的query类型
    let url = '/schematics/search';
    
    // 如果query已经包含了问号，说明它已经是格式化好的URL参数
    if (typeof query === 'string' && query.startsWith('?')) {
        url += query;
    } 
    // 如果query是普通字符串，将其作为搜索词
    else if (typeof query === 'string') {
        url += `?q=${encodeURIComponent(query)}`;
    }
    // 如果query是对象，将其转为URL参数
    else if (typeof query === 'object' && query !== null) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value);
            }
        });
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
    }
    
    const response = await api.get(url);
    return response.data;
};

export const getSchematic = async (id) => {
    const response = await api.get(`/schematics/${id}`);
    const data = response.data;
    
    // 构建API路径并利用axios实例确保认证
    const baseUrl = api.defaults.baseURL;
    
    // 构建访问三视图的API路径
    return {
        ...data,
        // 添加时间戳防止缓存
        topViewPath: `${baseUrl}/schematics/${id}/top-view?t=${Date.now()}`,
        sideViewPath: `${baseUrl}/schematics/${id}/side-view?t=${Date.now()}`,
        frontViewPath: `${baseUrl}/schematics/${id}/front-view?t=${Date.now()}`,
        // 为了调试，记录原始路径
        _debug: {
            originalPaths: {
                top: data.top_view_path,
                side: data.side_view_path,
                front: data.front_view_path
            }
        }
    };
};

export const updateSchematic = async (id, data) => {
    const response = await api.put(`/schematics/${id}`, data);
    return response.data;
};

export const deleteSchematic = async (id) => {
    const response = await api.delete(`/schematics/${id}`);
    return response.data;
};

export const downloadSchematic = async (id, name) => {
    try {
        const response = await api.get(`/schematics/${id}/download`, {
            responseType: 'blob'
        });
        
        // 从响应头中获取文件名
        const contentDisposition = response.headers['content-disposition'];
        let filename = '';
        
        if (contentDisposition) {
            // 尝试从不同格式中提取文件名
            // 1. 先尝试RFC 5987格式 (filename*=UTF-8''...)
            const rfc5987Regex = /filename\*=UTF-8''([^;"\s]+)/i;
            const rfc5987Matches = rfc5987Regex.exec(contentDisposition);
            
            // 2. 再尝试普通格式 (filename="...")
            const regularRegex = /filename="([^"]+)"/i;
            const regularMatches = regularRegex.exec(contentDisposition);
            
            if (rfc5987Matches && rfc5987Matches.length > 1) {
                // RFC 5987格式需要解码
                filename = decodeURIComponent(rfc5987Matches[1]);
            } else if (regularMatches && regularMatches.length > 1) {
                // 普通格式直接使用
                filename = regularMatches[1];
            }
        }
        
        // 如果无法从响应头获取文件名，则使用传入的name参数
        if (!filename) {
            filename = name || 'schematic.litematic';
        }
        
        // 确保文件名以.litematic结尾
        if (!filename.toLowerCase().endsWith('.litematic')) {
            filename += '.litematic';
        }
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        
        // 添加到DOM并触发点击
        document.body.appendChild(link);
        link.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        return { success: true, filename };
    } catch (error) {
        throw error;
    }
};

export const getSchematicViews = async (id) => {
    try {
        const response = await api.get(`/schematics/${id}`);
        const data = response.data;
        
        // 构建API路径并利用axios实例确保认证
        const baseUrl = api.defaults.baseURL;
        
        return {
            ...data,
            // 添加时间戳防止缓存 
            frontViewPath: `${baseUrl}/schematics/${id}/front-view?t=${Date.now()}`,
            sideViewPath: `${baseUrl}/schematics/${id}/side-view?t=${Date.now()}`,
            topViewPath: `${baseUrl}/schematics/${id}/top-view?t=${Date.now()}`
        };
    } catch (error) {
        throw error;
    }
};

export const updateSchematicVisibility = async (id, isPublic) => {
    try {
        const response = await api.put(`/schematics/${id}`, { is_public: isPublic });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 获取带有认证的视图URL
export const getAuthenticatedViewUrl = async (schematicId, viewType) => {
    try {
        const user = authService.getCurrentUser();
        let url = `${API_URL}/schematics/${schematicId}/${viewType}?t=${Date.now()}`;
        
        if (user && user.token) {
            // 如果需要手动添加认证，可以使用这种方式
            // 但这种方法并不理想，因为token会直接暴露在URL中
            url += `&token=${user.token}`;
        }
        
        // 返回URL供<img>标签使用
        return url;
    } catch (error) {
        return null;
    }
};

// 直接获取视图数据为Blob
export const getViewBlob = async (schematicId, viewType) => {
    try {
        const response = await api.get(`/schematics/${schematicId}/${viewType}`, {
            responseType: 'blob'
        });
        return URL.createObjectURL(response.data);
    } catch (error) {
        return null;
    }
};

/**
 * 获取原理图文件，返回File对象供3D渲染器使用
 * @param {string|number} schematicId - 原理图ID
 * @returns {Promise<File|null>} - 返回File对象或null
 */
export const getLitematicFile = async (schematicId) => {
    try {
        // 使用raw=true参数获取原始文件
        const response = await api.get(`/schematics/${schematicId}/download`, {
            responseType: 'blob',
            params: {
                raw: true
            }
        });
        
        if (!response.data || response.data.size === 0) {
            return null;
        }
        
        // 提取文件名
        let filename = '';
        const contentDisposition = response.headers['content-disposition'];
        
        if (contentDisposition) {
            // 尝试从头部提取文件名
            const matches = /filename="([^"]+)"|filename\*=UTF-8''([^;"\s]+)/i.exec(contentDisposition);
            if (matches) {
                filename = matches[1] || decodeURIComponent(matches[2]) || `schematic_${schematicId}.litematic`;
            }
        }
        
        if (!filename) {
            filename = `schematic_${schematicId}.litematic`;
        }
        
        // 确保文件名以.litematic结尾
        if (!filename.toLowerCase().endsWith('.litematic')) {
            filename += '.litematic';
        }
        
        // 创建File对象
        return new File([response.data], filename, {
            type: 'application/octet-stream'
        });
    } catch (error) {
        return null;
    }
}; 