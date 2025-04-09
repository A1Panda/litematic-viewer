const puppeteer = require('puppeteer-core');
const { installChrome, CHROME_PATH } = require('../utils/chromeInstaller');

class LitematicProcessor {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        try {
            // 安装Chrome
            const chromePath = await installChrome();
            
            // 启动浏览器
            this.browser = await puppeteer.launch({
                executablePath: chromePath,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            // 创建新页面
            this.page = await this.browser.newPage();
            
            console.log('浏览器初始化成功');
        } catch (error) {
            console.error('浏览器初始化失败:', error);
            throw error;
        }
    }

    // ... 其他现有代码 ...
}

module.exports = LitematicProcessor; 