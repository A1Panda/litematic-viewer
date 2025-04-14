# litematic-viewer

一个用于 Minecraft `.litematic` 原理图文件的管理和预览系统。用户可以上传、搜索、查看原理图的预览图（俯视图、正视图、侧视图）和所需的材料列表。

## 项目特性

*   **原理图上传**: 支持上传 `.litematic` 格式的文件。
*   **预览生成**: **依赖外部渲染服务器 (`litematic-viewer-server`)** 自动处理上传的文件，生成俯视图、正视图和侧视图的 PNG 预览图。
*   **材料列表**: **依赖外部渲染服务器** 解析原理图，统计并显示所需的方块材料列表，支持按数量排序，并以"盒"、"组"、"个"为单位进行友好展示。
*   **3D预览**: 支持在浏览器中直接预览原理图的3D模型，支持WASD移动和鼠标控制视角。
*   **原理图管理**:
    *   列表展示所有已上传的原理图。
    *   提供搜索功能，按名称快速查找。
    *   支持编辑原理图名称。
    *   支持删除原理图。
*   **用户系统**:
    *   支持用户注册和登录。
    *   支持设置原理图为公开或私有。
    *   管理员可以管理所有原理图。
*   **Web 界面**: 基于 React 和 Material-UI 构建的现代化用户界面。

## 技术栈

*   **后端**: Node.js, Express.js
*   **前端**: React, Material-UI
*   **数据库**: MySQL
*   **文件上传**: Multer
*   **API 通信**: Axios
*   **原理图处理**: 外部 `litematic-viewer-server` (基于 DeepSlate)
*   **3D渲染**: WebGL, Three.js

## 系统要求

*   **Node.js**: v14.0.0 或更高版本
*   **MySQL**: 5.7 或更高版本
*   **操作系统**: Windows, Linux, macOS
*   **浏览器**: Chrome, Firefox, Edge 等现代浏览器
*   **内存**: 建议至少 4GB RAM
*   **存储空间**: 根据原理图数量而定，建议至少 10GB 可用空间

## 快速开始

### 1. 环境准备

*   安装 [Node.js](https://nodejs.org/) (推荐 LTS 版本)
*   安装 [MySQL](https://www.mysql.com/) 数据库
*   **准备 Litematic 渲染服务器**: 本项目依赖一个独立的服务器来处理 `.litematic` 文件并生成预览。你需要单独下载、配置并运行该服务器。

### 2. 克隆项目

*   **克隆主应用仓库**:
    ```bash
    git clone https://github.com/A1Panda/litematic-viewer.git
    cd litematic-viewer
    ```
*   **克隆渲染服务器仓库** (在另一个目录):
    ```bash
    git clone https://github.com/A1Panda/litematic-viewer-server.git
    cd litematic-viewer-server
    ```

### 3. 渲染服务器配置与启动 (litematic-viewer-server)

*   **进入渲染服务器目录**:
    ```bash
    cd path/to/litematic-viewer-server
    ```
*   **安装依赖**:
    ```bash
    npm install
    ```
*   **配置环境变量** (可选):
    ```dotenv:.env
    PORT=3000
    MAX_FILE_SIZE=10485760  # 10MB
    ALLOWED_ORIGINS=http://localhost:3001
    ```
*   **启动渲染服务器**:
    ```bash
    npm start
    ```
*   渲染服务器默认运行在 `http://localhost:3000`。**请确保此服务器正在运行。**

### 4. 后端配置与启动 (litematic-viewer)

*   **进入主应用后端目录**:
    ```bash
    cd path/to/litematic-viewer
    ```
*   **安装依赖**:
    ```bash
    npm install
    npm install dotenv # 安装 dotenv 用于环境变量
    ```
*   **配置环境变量**: 在项目根目录创建 `.env` 文件，并配置数据库连接信息和渲染服务器地址：
    ```dotenv:.env
    # 数据库配置
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=litematic
    
    # 服务器配置
    PORT=3001
    RENDER_SERVER_URL=http://localhost:3000
    
    # JWT配置
    JWT_SECRET=your_jwt_secret
    JWT_EXPIRES_IN=24h
    
    # 文件上传配置
    UPLOAD_DIR=./uploads
    MAX_FILE_SIZE=10485760  # 10MB
    
    # 跨域配置
    CORS_ORIGIN=http://localhost:3000
    ```
    * **重要**: 将 `.env` 文件添加到 `.gitignore`。
*   **数据库配置**:
    *   确保 `server/config/database.js` 使用 `process.env` 读取环境变量。
    *   **数据库初始化**: 
        ```sql
        -- 创建数据库
        CREATE DATABASE IF NOT EXISTS litematic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        USE litematic;

        -- 创建用户表
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE,
            role ENUM('user', 'admin') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- 创建原理图表
        CREATE TABLE IF NOT EXISTS schematics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            top_view_path VARCHAR(255),
            side_view_path VARCHAR(255),
            front_view_path VARCHAR(255),
            materials TEXT,
            user_id INT,
            is_public BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        -- 创建索引
        CREATE INDEX idx_schematic_name ON schematics(name);
        CREATE INDEX idx_schematic_user ON schematics(user_id);
        CREATE INDEX idx_schematic_public ON schematics(is_public);

        -- 创建初始管理员账户(密码需要加密后存储)
        INSERT INTO users (username, password, email, role) 
        VALUES ('admin', '$2b$10$...', 'admin@example.com', 'admin');
        ```
    *   **性能优化建议**:
        * 使用连接池优化数据库连接
        * 定期清理未使用的预览图文件
        * 考虑使用Redis缓存热门原理图数据
        * 对于大型原理图，考虑分片存储
*   **启动后端服务**:
    *   开发模式 (自动重启):
        ```bash
        npm run dev
        ```
    *   生产模式:
        ```bash
        npm start
        ```
    *   后端服务默认运行在 `http://localhost:3001`。

### 5. 前端配置与启动 (litematic-viewer/client)

*   **进入 client 目录**:
    ```bash
    cd client
    ```
*   **安装依赖**:
    ```bash
    npm install
    ```
*   **配置环境变量**: 在 `client` 目录下创建 `.env` 文件，并配置后端 API 地址：
    ```dotenv:client/.env
    REACT_APP_API_URL=http://localhost:3001/api
    REACT_APP_WS_URL=ws://localhost:3001
    PORT=3000
    ```
*   **启动前端开发服务器**:
    ```bash
    npm start
    ```
*   前端应用默认运行在 `http://localhost:3000`。

### 6. 访问应用

打开浏览器，访问前端运行的地址 (例如 `http://localhost:3000`)。

## 使用指南

### 用户注册与登录

1. 点击右上角的"注册"按钮创建新账户
2. 填写用户名、邮箱和密码
3. 注册成功后自动登录
4. 或使用已有账户登录

### 上传原理图

1. 点击导航栏的"上传原理图"按钮
2. 选择要上传的 `.litematic` 文件
3. 填写原理图名称（可选）
4. 选择是否公开（默认为公开）
5. 点击"上传"按钮

### 查看原理图

1. 在首页浏览所有原理图
2. 使用搜索框按名称搜索
3. 点击原理图卡片查看详情
4. 在详情页可以：
   - 查看三视图预览
   - 查看材料列表
   - 进行3D预览
   - 下载原始文件
   - 编辑名称（如果是自己的原理图）
   - 删除原理图（如果是自己的原理图）

### 3D预览控制

*   **移动控制**:
    - W: 向前移动
    - S: 向后移动
    - A: 向左移动
    - D: 向右移动
    - Space: 向上移动
    - Shift: 向下移动
*   **视角控制**:
    - 鼠标左键拖动: 旋转视角
    - 鼠标右键拖动: 平移视角
    - 鼠标滚轮: 缩放
*   **其他控制**:
    - R: 重置视角
    - F: 全屏切换
    - ESC: 退出全屏

## API 文档

### 认证接口

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
    "username": "string",
    "password": "string",
    "email": "string"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
    "username": "string",
    "password": "string"
}
```

### 原理图接口

#### 上传原理图
```
POST /api/schematics/upload
Content-Type: multipart/form-data

file: File
name: string (optional)
is_public: boolean (optional)
```

#### 获取原理图列表
```
GET /api/schematics
Authorization: Bearer <token>
```

#### 搜索原理图
```
GET /api/schematics/search?q=<keyword>
Authorization: Bearer <token>
```

#### 获取原理图详情
```
GET /api/schematics/:id
Authorization: Bearer <token>
```

#### 更新原理图
```
PUT /api/schematics/:id
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "string",
    "is_public": boolean
}
```

#### 删除原理图
```
DELETE /api/schematics/:id
Authorization: Bearer <token>
```

#### 获取预览图
```
GET /api/schematics/:id/top-view
GET /api/schematics/:id/front-view
GET /api/schematics/:id/side-view
Authorization: Bearer <token>
```

#### 获取材料列表
```
GET /api/schematics/:id/materials
Authorization: Bearer <token>
```

#### 下载原理图
```
GET /api/schematics/:id/download
Authorization: Bearer <token>
```

## 部署指南

### 生产环境部署

1. **数据库优化**:
   ```sql
   -- 优化表结构
   ALTER TABLE schematics ENGINE=InnoDB;
   ALTER TABLE users ENGINE=InnoDB;
   
   -- 添加复合索引
   CREATE INDEX idx_schematic_search ON schematics(name, is_public);
   ```

2. **Nginx 配置**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # 前端静态文件
       location / {
           root /path/to/client/build;
           try_files $uri $uri/ /index.html;
       }
       
       # 后端API代理
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # 渲染服务器代理
       location /render {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **PM2 进程管理**:
   ```bash
   # 安装PM2
   npm install -g pm2
   
   # 启动后端服务
   pm2 start server/index.js --name "litematic-backend"
   
   # 启动渲染服务
   pm2 start litematic-viewer-server/index.js --name "litematic-render"
   
   # 设置开机自启
   pm2 startup
   pm2 save
   ```

### 监控与维护

1. **日志管理**:
   ```bash
   # 查看日志
   pm2 logs litematic-backend
   pm2 logs litematic-render
   
   # 日志轮转
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. **性能监控**:
   ```bash
   # 安装监控工具
   npm install -g pm2-monit
   
   # 启动监控
   pm2 monit
   ```

3. **定期维护**:
   ```sql
   -- 清理未使用的预览图
   DELETE FROM schematics 
   WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) 
   AND user_id IS NULL;
   
   -- 优化表
   OPTIMIZE TABLE schematics;
   OPTIMIZE TABLE users;
   ```

## 故障排除

### 常见问题

1. **上传失败**
   - 检查文件大小是否超过限制
   - 检查文件格式是否为 `.litematic`
   - 检查存储目录权限

2. **预览图生成失败**
   - 检查渲染服务器是否运行
   - 检查网络连接
   - 检查文件权限

3. **数据库连接失败**
   - 检查数据库服务是否运行
   - 检查连接信息是否正确
   - 检查防火墙设置

4. **3D预览无法加载**
   - 检查浏览器是否支持WebGL
   - 检查文件是否完整
   - 检查网络连接

### 日志查看

```bash
# 后端日志
tail -f server/logs/error.log
tail -f server/logs/access.log

# 渲染服务器日志
tail -f litematic-viewer-server/logs/error.log
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`) 
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目维护者: [A1_Panda]
- 邮箱: A1_Panda@outlook.com
- 项目链接: https://github.com/A1Panda/litematic-viewer
