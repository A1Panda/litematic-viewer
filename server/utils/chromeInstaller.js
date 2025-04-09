const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const execAsync = promisify(exec);

const CHROME_VERSION = '135.0.7049.42';
const CHROME_URL = `https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${CHROME_VERSION}/linux64/chrome-linux64.zip`;
const CHROME_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.cache', 'puppeteer');
const CHROME_PATH = path.join(CHROME_DIR, 'chrome-linux64', 'chrome');

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function installChrome() {
    try {
        // 检查Chrome是否已安装
        if (fs.existsSync(CHROME_PATH)) {
            console.log('Chrome已安装，跳过安装步骤');
            return CHROME_PATH;
        }

        console.log('开始安装Chrome...');
        
        // 创建目录
        if (!fs.existsSync(CHROME_DIR)) {
            fs.mkdirSync(CHROME_DIR, { recursive: true });
        }

        const zipPath = path.join(CHROME_DIR, 'chrome.zip');
        
        // 下载Chrome
        console.log('正在下载Chrome...');
        await downloadFile(CHROME_URL, zipPath);
        
        // 解压文件
        console.log('正在解压Chrome...');
        await execAsync(`unzip -o ${zipPath} -d ${CHROME_DIR}`);
        
        // 删除zip文件
        fs.unlinkSync(zipPath);
        
        // 设置执行权限
        await execAsync(`chmod +x ${CHROME_PATH}`);
        
        console.log('Chrome安装完成');
        return CHROME_PATH;
    } catch (error) {
        console.error('安装Chrome失败:', error);
        throw error;
    }
}

module.exports = {
    installChrome,
    CHROME_PATH
}; 