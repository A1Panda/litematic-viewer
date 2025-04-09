const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// 配置
const SERVER_URL = 'http://localhost:3000';
const TEST_FILE_PATH = './test-files/test.litematic'; // 替换为你的测试文件路径 

// 调试函数
function debugLog(message, data = null) {
    console.log(`[DEBUG] ${message}`);
    if (data) {
        try {
            const safeData = JSON.parse(JSON.stringify(data, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (value.constructor.name === 'Socket' || 
                        value.constructor.name === 'ClientRequest' ||
                        value.constructor.name === 'IncomingMessage') {
                        return `[${value.constructor.name}]`;
                    }
                }
                return value;
            }));
            console.log(JSON.stringify(safeData, null, 2));
        } catch (e) {
            console.log('无法序列化数据:', e.message);
        }
    }
}

// 检查文件是否存在
function checkFileExists(filePath) {
    try {
        const exists = fs.existsSync(filePath);
        debugLog(`检查文件是否存在: ${filePath}`, { exists });
        if (exists) {
            const stats = fs.statSync(filePath);
            debugLog(`文件信息:`, {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            });
        }
        return exists;
    } catch (error) {
        debugLog(`检查文件失败: ${error.message}`);
        return false;
    }
}

async function downloadFile(url, outputPath) {
    try {
        debugLog(`尝试下载文件: ${url}`);

        const response = await axios.get(url, {
            responseType: 'stream',
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                debugLog(`文件下载完成: ${outputPath}`);
                resolve();
            });
            writer.on('error', (err) => {
                debugLog(`文件下载失败: ${err.message}`);
                reject(err);
            });
        });
    } catch (error) {
        if (error.response) {
            debugLog('服务器响应:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else if (error.request) {
            debugLog('请求信息:', {
                method: error.request.method,
                path: error.request.path,
                headers: error.request.headers
            });
        }
        throw error;
    }
}

async function testUpload() {
    try {
        console.log('开始测试文件上传...');
        
        // 检查测试文件是否存在
        if (!fs.existsSync(TEST_FILE_PATH)) {
            throw new Error(`测试文件不存在: ${TEST_FILE_PATH}`);
        }

        // 创建 FormData
        const formData = new FormData();
        formData.append('file', fs.createReadStream(TEST_FILE_PATH));

        // 发送上传请求
        console.log('正在上传文件...');
        const uploadResponse = await axios.post(`${SERVER_URL}/api/upload`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        debugLog('上传响应:', uploadResponse.data);

        if (!uploadResponse.data.success) {
            throw new Error(`上传失败: ${uploadResponse.data.error}`);
        }

        console.log('上传成功！');
        const { processId, views, materials, original } = uploadResponse.data;

        // 创建下载目录
        const downloadDir = path.join(__dirname, 'downloads', processId);
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        // 下载所有文件
        console.log('开始下载处理结果...');
        
        // 下载视图图片
        for (const view of views) {
            console.log(`下载视图: ${view}`);
            const viewUrl = `${SERVER_URL}/api/download/${processId}/${view}`;
            const viewPath = path.join(downloadDir, view);
            try {
                await downloadFile(viewUrl, viewPath);
            } catch (error) {
                console.error(`下载视图 ${view} 失败:`, error.message);
                continue;
            }
        }

        // 下载材料列表
        console.log('下载材料列表...');
        const materialsUrl = `${SERVER_URL}/api/download/${processId}/${materials}`;
        const materialsPath = path.join(downloadDir, materials);
        try {
            await downloadFile(materialsUrl, materialsPath);
        } catch (error) {
            console.error('下载材料列表失败:', error.message);
        }

        // 下载原始文件
        console.log('下载原始文件...');
        const originalUrl = `${SERVER_URL}/api/download/${processId}/${original}`;
        const originalPath = path.join(downloadDir, original);
        try {
            await downloadFile(originalUrl, originalPath);
        } catch (error) {
            console.error('下载原始文件失败:', error.message);
        }

        console.log('所有文件下载完成！');
        console.log(`文件保存在: ${downloadDir}`);

    } catch (error) {
        console.error('测试失败:', error.message);
        if (error.response) {
            console.error('服务器响应:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
    }
}

// 运行测试
testUpload(); 