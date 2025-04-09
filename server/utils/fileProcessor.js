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
        uploadEndpoint: '/api/upload',
        downloadEndpoint: '/api/download'
    },
    // 存储路径配置
    storage: {
        baseDir: path.join(__dirname, '../uploads')
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
        // 使用时间戳重命名文件
        const tempFilePath = path.join(path.dirname(filePath), `${tempName}.litematic`);
        fs.copyFileSync(filePath, tempFilePath);
        formData.append('file', fs.createReadStream(tempFilePath), `${tempName}.litematic`);
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

        // 为每个处理过程创建独立的文件夹
        const processDir = path.join(config.storage.baseDir, 'processed', `${tempName}_${processId}`);
        console.log('创建处理目录:', processDir);
        
        // 确保目录存在
        if (!fs.existsSync(processDir)) {
            fs.mkdirSync(processDir, { recursive: true });
            console.log('处理目录创建成功');
        }
        
        // 下载文件
        console.log('下载处理后的文件...');
        
        // 视图文件
        const viewPaths = await Promise.all(
            views.map(async (view, index) => {
                try {
                    const viewType = getViewType(view, index);
                    const tempFilePath = await downloadFile(processId, view, processDir, `${viewType}.png`, `${tempName}_${processId}`);
                    if (!tempFilePath) {
                        throw new Error(`下载视图文件失败: ${view}`);
                    }
                    // 使用原始文件名重命名文件
                    const finalFilePath = path.join(processDir, `${originalName}_${viewType}.png`);
                    fs.renameSync(tempFilePath, finalFilePath);
                    return finalFilePath;
                } catch (error) {
                    console.error(`下载视图文件失败: ${error.message}`);
                    throw error;
                }
            })
        );
        
        // 材料文件
        let materialsPath = null;
        try {
            const tempMaterialsPath = await downloadFile(processId, materials, processDir, 'materials.json', `${tempName}_${processId}`);
            if (!tempMaterialsPath) {
                throw new Error('下载材料列表失败');
            }
            // 使用原始文件名重命名文件
            materialsPath = path.join(processDir, `${originalName}_materials.json`);
            fs.renameSync(tempMaterialsPath, materialsPath);
        } catch (error) {
            console.error(`下载材料列表失败: ${error.message}`);
            throw error;
        }
        
        // 原始文件
        let originalPath = null;
        try {
            const tempOriginalPath = await downloadFile(processId, original, processDir, `${tempName}.litematic`, `${tempName}_${processId}`);
            if (!tempOriginalPath) {
                throw new Error('下载原始文件失败');
            }
            // 使用原始文件名重命名文件
            originalPath = path.join(processDir, `${originalName}.litematic`);
            fs.renameSync(tempOriginalPath, originalPath);
        } catch (error) {
            console.error(`下载原始文件失败: ${error.message}`);
            throw error;
        }

        // 清理临时文件
        try {
            fs.unlinkSync(tempFilePath);
            console.log('临时文件已删除:', tempFilePath);
        } catch (error) {
            console.error('删除临时文件失败:', error);
        }

        console.log('所有文件下载完成');
        
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

async function downloadFile(processId, filename, targetDir, newName, outputDirName) {
    try {
        console.log(`开始下载文件: ${filename}`);
        
        // 使用输出目录名构建URL，确保正确处理中文
        const encodedOutputDir = encodeURIComponent(outputDirName);
        const encodedFilename = encodeURIComponent(filename);
        const url = `${RENDER_SERVER_BASE_URL}${config.viewerServer.downloadEndpoint}/${encodedOutputDir}/${encodedFilename}`;
        console.log('下载URL:', url);
        
        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 30000, // 30秒超时
            validateStatus: status => status >= 200 && status < 300
        });

        const filePath = path.join(targetDir, newName);
        console.log(`保存到: ${filePath}`);
        
        // 确保目录存在
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
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