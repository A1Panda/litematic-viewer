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
        
        console.log('原始文件名:', originalName);
        console.log('临时文件名:', tempName);
        console.log('完整文件名:', fileName);
        
        // 创建 FormData 实例
        const formData = new FormData();
        
        // 直接使用原始文件，不再进行复制
        // 文件已经在server/uploads目录中，直接使用
        formData.append('file', fs.createReadStream(filePath), `${tempName}.litematic`);
        console.log('FormData 创建成功');

        // 调用 litematic-viewer-server API
        const uploadUrl = `${RENDER_SERVER_BASE_URL}${config.viewerServer.uploadEndpoint}`;
        console.log('正在发送请求到:', uploadUrl);
        
        const response = await axios.post(uploadUrl, formData, {
            headers: {
                ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        console.log('API 请求成功，响应状态:', response.status);
        console.log('API 响应数据:', response.data);

        if (!response.data.success) {
            throw new Error(`服务器处理失败: ${response.data.error || '未知错误'}`);
        }

        const processId = response.data.processId;
        const views = response.data.views || [];
        const materials = response.data.materials;
        const original = response.data.original;

        console.log('处理ID:', processId);
        console.log('视图文件:', views);
        console.log('材料列表:', materials);
        console.log('原始文件:', original);

        // 为每个处理创建单独的文件夹
        const schematicDir = path.join(config.storage.processedDir, tempName);
        console.log('使用单独的处理目录:', schematicDir);
        
        // 确保目录存在
        if (!fs.existsSync(schematicDir)) {
            fs.mkdirSync(schematicDir, { recursive: true });
            console.log('处理目录创建成功');
        }
        
        // 下载文件
        console.log('下载处理后的文件...');
        
        // 视图文件 - 简化文件名并存储在单独文件夹中
        const viewPaths = await Promise.all(
            views.map(async (view, index) => {
                try {
                    const viewType = getViewType(view, index);
                    // 简化文件名
                    const viewFileName = view; // 直接使用API返回的文件名
                    const targetFilename = `${viewType}.png`; // 更简化的文件名，去掉时间戳前缀
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
            // 使用API返回的材料文件名
            const materialsFileName = materials; // 直接使用API返回的文件名
            const targetFilename = `materials.json`; // 更简化的文件名
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
            // 使用API返回的原始文件名
            const originalFileName = original; // 直接使用API返回的文件名
            const targetFilename = `original.litematic`; // 更简化的文件名
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
                console.log('清理临时文件成功:', filePath);
            }
        } catch (error) {
            console.error('清理临时文件失败:', error.message);
            // 继续执行，不阻断正常流程
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
        } else if (error.request) {
            console.error('请求已发送但没有收到响应:', error.request);
        } else {
            console.error('请求配置出错:', error.message);
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
        console.log(`开始下载文件: ${filename}`);
        
        // 根据示例的正确URL格式构建
        const encodedFilename = encodeURIComponent(filename);
        
        // 构建完整的处理ID路径部分，格式应为：timestamp_uuid
        const fullProcessId = `${tempName}_${processId}`;
        
        // 构建完整的URL: http://localhost:3000/api/download/1744341798236_cbdf682e-6822-4e36-b186-955bd838c0c4/1744341798236_topView.png
        const url = `${RENDER_SERVER_BASE_URL}${config.viewerServer.downloadEndpoint}/${fullProcessId}/${encodedFilename}`;
        console.log('下载URL:', url);
        
        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 30000, // 30秒超时
            validateStatus: status => status >= 200 && status < 300
        });

        const filePath = path.join(targetDir, newName);
        console.log(`保存到: ${filePath}`);
        
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
                    console.log(`文件下载并保存成功: ${filePath}`);
                    resolve(filePath);
                }
                // 如果有错误，已在error事件中处理
            });
            writer.on('finish', () => {
                console.log(`文件写入完成: ${filePath}`);
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