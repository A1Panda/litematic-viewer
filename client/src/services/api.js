import axios from 'axios';
import authService from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
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
        console.log('使用已格式化的URL参数:', query);
    } 
    // 如果query是普通字符串，将其作为搜索词
    else if (typeof query === 'string') {
        url += `?q=${encodeURIComponent(query)}`;
        console.log('使用字符串作为搜索词:', query);
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
        console.log('将对象转换为URL参数:', params.toString());
    }
    
    console.log('搜索API URL:', url);
    const response = await api.get(url);
    return response.data;
};

export const getSchematic = async (id) => {
    const response = await api.get(`/schematics/${id}`);
    const data = response.data;
    
    console.log('原理图API响应:', data);
    
    // 构建API路径并利用axios实例确保认证
    const baseUrl = api.defaults.baseURL;
    
    // 构建访问三视图的API路径
    const result = {
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
    
    // 打印完整URL信息以便调试
    console.log('构建的三视图API路径:');
    console.log('- 顶视图URL:', result.topViewPath);
    console.log('- 侧视图URL:', result.sideViewPath); 
    console.log('- 正视图URL:', result.frontViewPath);
    
    return result;
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
        console.log('开始下载原理图:', id, name);
        const response = await api.get(`/schematics/${id}/download`, {
            responseType: 'blob'
        });
        
        // 从响应头中获取文件名
        const contentDisposition = response.headers['content-disposition'];
        let filename = '';
        
        if (contentDisposition) {
            console.log('Content-Disposition:', contentDisposition);
            
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
                console.log('从RFC 5987格式提取的文件名:', filename);
            } else if (regularMatches && regularMatches.length > 1) {
                // 普通格式直接使用
                filename = regularMatches[1];
                console.log('从普通格式提取的文件名:', filename);
            }
        }
        
        // 如果无法从响应头获取文件名，则使用传入的name参数
        if (!filename) {
            filename = name || 'schematic.litematic';
            console.log('使用默认文件名:', filename);
        }
        
        // 确保文件名以.litematic结尾
        if (!filename.toLowerCase().endsWith('.litematic')) {
            filename += '.litematic';
        }
        
        // 创建下载链接
        console.log('最终下载文件名:', filename);
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
        console.error('下载失败:', error);
        throw error;
    }
};

export const getSchematicViews = async (id) => {
    try {
        const response = await api.get(`/schematics/${id}`);
        const data = response.data;
        
        console.log('获取原理图视图API响应:', data);
        
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
        console.error('获取视图失败:', error);
        throw error;
    }
};

export const updateSchematicVisibility = async (id, isPublic) => {
    try {
        console.log(`API - 更新原理图 ${id} 可见性为: ${isPublic ? '公开' : '私有'}`);
        const response = await api.put(`/schematics/${id}`, { is_public: isPublic });
        
        console.log('可见性更新成功，服务器响应:', response.data);
        return response.data;
    } catch (error) {
        console.error('更新可见性失败:', error);
        if (error.response) {
            console.error('服务器错误响应:', error.response.data);
        }
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
        
        // 验证URL能否访问
        console.log(`验证视图URL: ${url}`);
        
        // 返回URL供<img>标签使用
        return url;
    } catch (error) {
        console.error(`获取${viewType}视图URL失败:`, error);
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
        console.error(`获取${viewType}视图失败:`, error);
        return null;
    }
}; 