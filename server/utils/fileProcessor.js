const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');

// 配置信息
const config = {
    // litematic-viewer-server 配置
    viewerServer: {
        //host: 'http://localhost:3000',
        host: process.env.RENDER_SERVER_URL || 'http://localhost:3000',
        uploadEndpoint: '/api/upload',
        downloadEndpoint: '/api/download'
    },
    // 存储路径配置
    storage: {
        baseDir: path.join(__dirname, '../uploads'),  // 修正为server目录下的uploads文件夹
        processedDir: path.join(__dirname, '../uploads/processed')  // 相应修正processed子目录
    }
};

const RENDER_SERVER_BASE_URL = process.env.RENDER_SERVER_URL || 'http://localhost:3000'; // 使用环境变量，并提供默认值

async function processLitematicFile(filePath) {
    try {
        console.log('开始处理文件:', filePath);

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
        }
        
        // 获取原始文件名（不含路径和扩展名）
        const originalName = path.basename(filePath, '.litematic');
        const timestamp = Date.now();
        const tempName = `${timestamp}`; // 使用时间戳作为临时名称
        const fileName = path.basename(filePath);
        
        // 创建 FormData 实例
        const formData = new FormData();
        
        // 直接使用原始文件，不再进行复制
        formData.append('file', fs.createReadStream(filePath), `${tempName}.litematic`);

        // 调用 litematic-viewer-server API
        const uploadUrl = `${RENDER_SERVER_BASE_URL}${config.viewerServer.uploadEndpoint}`;
        
        const response = await axios.post(uploadUrl, formData, {
            headers: {
                ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        if (!response.data.success) {
            throw new Error(`服务器处理失败: ${response.data.error || '未知错误'}`);
        }

        const processId = response.data.processId;
        const views = response.data.views || [];
        const materials = response.data.materials;
        const original = response.data.original;

        console.log('文件处理成功，开始下载结果文件');

        // 为每个处理创建单独的文件夹
        const schematicDir = path.join(config.storage.processedDir, tempName);
        
        // 确保目录存在
        if (!fs.existsSync(schematicDir)) {
            fs.mkdirSync(schematicDir, { recursive: true });
        }
        
        // 视图文件 - 简化文件名并存储在单独文件夹中
        const viewPaths = await Promise.all(
            views.map(async (view, index) => {
                try {
                    const viewType = getViewType(view, index);
                    // 简化文件名
                    const viewFileName = view; 
                    const targetFilename = `${viewType}.png`; 
                    const tempFilePath = await downloadFile(processId, viewFileName, schematicDir, targetFilename, tempName);
                    if (!tempFilePath) {
                        throw new Error(`下载视图文件失败: ${view}`);
                    }
                    return tempFilePath;
                } catch (error) {
                    console.error(`下载视图文件失败: ${error.message}`);
                    throw error;
                }
            })
        );
        
        // 材料文件 - 简化文件名并存储在单独文件夹中
        let materialsPath = null;
        try {
            const materialsFileName = materials;
            const targetFilename = `materials.json`;
            materialsPath = await downloadFile(processId, materialsFileName, schematicDir, targetFilename, tempName);
            if (!materialsPath) {
                throw new Error('下载材料列表失败');
            }
        } catch (error) {
            console.error(`下载材料列表失败: ${error.message}`);
            throw error;
        }
        
        // 原始文件 - 简化文件名并存储在单独文件夹中
        let originalPath = null;
        try {
            const originalFileName = original;
            const targetFilename = `original.litematic`;
            originalPath = await downloadFile(processId, originalFileName, schematicDir, targetFilename, tempName);
            if (!originalPath) {
                throw new Error('下载原始文件失败');
            }
        } catch (error) {
            console.error(`下载原始文件失败: ${error.message}`);
            throw error;
        }

        console.log('所有文件下载完成');
        
        // 清理临时文件 - 删除上传的原始文件
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('清理临时文件失败:', error.message);
        }
        
        // 返回结果
        return {
            topViewPath: viewPaths[2],
            sideViewPath: viewPaths[1],
            frontViewPath: viewPaths[0],
            materials: materialsPath,
            original: originalPath
        };
    } catch (error) {
        console.error('文件处理失败:', error.message);
        if (error.response) {
            console.error('服务器响应:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        
        throw new Error(`文件处理失败: ${error.message}`);
    }
}

// 根据视图文件名或索引确定视图类型
function getViewType(filename, index) {
    if (filename.includes('frontView')) return 'front';
    if (filename.includes('sideView')) return 'side';
    if (filename.includes('topView')) return 'top';
    
    // 如果文件名不包含视图类型，根据索引确定
    if (index === 0) return 'front';
    if (index === 1) return 'side';
    if (index === 2) return 'top';
    
    return `view${index + 1}`;
}

async function downloadFile(processId, filename, targetDir, newName, tempName) {
    try {
        // 根据示例的正确URL格式构建
        const encodedFilename = encodeURIComponent(filename);
        
        // 构建完整的处理ID路径部分，格式应为：timestamp_uuid
        const fullProcessId = `${tempName}_${processId}`;
        
        // 构建完整的URL
        const url = `${RENDER_SERVER_BASE_URL}${config.viewerServer.downloadEndpoint}/${fullProcessId}/${encodedFilename}`;
        
        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 30000, // 30秒超时
            validateStatus: status => status >= 200 && status < 300
        });

        const filePath = path.join(targetDir, newName);
        
        // 确保目录存在
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    // 计算相对于uploads目录的路径
                    const uploadsDir = path.join(__dirname, '../uploads');
                    const relativePath = path.relative(uploadsDir, filePath).replace(/\\/g, '/');
                    resolve(relativePath);
                }
            });
            writer.on('finish', () => {
                writer.close();
            });
        });
    } catch (error) {
        console.error(`下载文件失败 (${filename}):`, error.message);
        if (error.response) {
            console.error('下载服务器响应:', {
                status: error.response.status,
                statusText: error.response.statusText
            });
        }
        throw error;
    }
}

module.exports = {
    processLitematicFile
}; 