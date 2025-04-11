# litematic-viewer

一个用于 Minecraft `.litematic` 原理图文件的管理和预览系统。用户可以上传、搜索、查看原理图的预览图（俯视图、正视图、侧视图）和所需的材料列表。

## 项目特性

*   **原理图上传**: 支持上传 `.litematic` 格式的文件。
*   **预览生成**: **依赖外部渲染服务器 (`litematic-viewer-server`)** 自动处理上传的文件，生成俯视图、正视图和侧视图的 PNG 预览图。
*   **材料列表**: **依赖外部渲染服务器** 解析原理图，统计并显示所需的方块材料列表，支持按数量排序，并以"盒"、"组"、"个"为单位进行友好展示。
*   **原理图管理**:
    *   列表展示所有已上传的原理图。
    *   提供搜索功能，按名称快速查找。
    *   支持编辑原理图名称。
    *   支持删除原理图。
*   **Web 界面**: 基于 React 和 Material-UI 构建的现代化用户界面。

## 技术栈

*   **后端**: Node.js, Express.js
*   **前端**: React, Material-UI
*   **数据库**: MySQL
*   **文件上传**: Multer
*   **API 通信**: Axios
*   **原理图处理**: 外部 `litematic-viewer-server` (基于 DeepSlate)

## 项目结构

## 使用方法

### 1. 环境准备

*   安装 [Node.js](https://nodejs.org/) (推荐 LTS 版本)
*   安装 [MySQL](https://www.mysql.com/) 数据库
*   **准备 Litematic 渲染服务器**: 本项目依赖一个独立的服务器来处理 `.litematic` 文件并生成预览。你需要单独下载、配置并运行该服务器。

### 2. 数据库配置

*   **创建数据库**:
    ```sql
    CREATE DATABASE litematic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```

*   **创建用户表**:
    ```sql
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    ```

*   **创建原理图表**:
    ```sql
    CREATE TABLE schematics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        front_view_path VARCHAR(255),
        side_view_path VARCHAR(255),
        top_view_path VARCHAR(255),
        materials_path VARCHAR(255),
        user_id INT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    ```

*   **创建管理员账户**:
    ```bash
    # 使用项目提供的脚本创建管理员账户
    node server/createAdmin.js
    ```

*   **配置数据库连接**:
    在项目根目录创建 `.env` 文件，添加以下配置：
    ```dotenv
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=litematic
    ```

### 3. 克隆项目

*   **克隆主应用仓库**:
    ```bash
    git clone <your-litematic-viewer-repository-url>
    cd litematic-viewer
    ```
*   **克隆渲染服务器仓库** (在另一个目录):
    ```bash
    git clone https://github.com/A1Panda/litematic-viewer-server.git
    cd litematic-viewer-server
    ```

### 4. 渲染服务器配置与启动 (litematic-viewer-server)

*   **进入渲染服务器目录**:
    ```bash
    cd path/to/litematic-viewer-server
    ```
*   **安装依赖**:
    ```bash
    npm install
    ```
*   **启动渲染服务器**:
    ```bash
    npm start
    ```
*   渲染服务器默认运行在 `http://localhost:3000` (可在 `.env` 文件中配置 `RENDER_SERVER_URL` 供主应用后端使用)。 **请确保此服务器正在运行。**

### 5. 后端配置与启动 (litematic-viewer)

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
    DB_HOST=your_db_host
    DB_PORT=your_db_port
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    RENDER_SERVER_URL=http://localhost:3000 # 渲染服务器地址
    ```
    * **重要**: 将 `.env` 文件添加到 `.gitignore`。
*   **数据库配置**:
    *   确保 `server/config/database.js` 使用 `process.env` 读取环境变量。
    *   确保数据库和所需的表结构已创建。
*   **检查渲染服务器地址调用**: 确认后端代码（例如 `server/controllers/schematicController.js`）中调用渲染服务器的部分使用了 `process.env.RENDER_SERVER_URL`。
*   **启动后端服务**:
    *   开发模式 (自动重启):
        ```bash
        npm run dev
        ```
    *   生产模式:
        ```bash
        npm start
        ```
    *   后端服务默认运行在 `http://localhost:3001` (可在 `server/app.js` 中修改)。

### 6. 前端配置与启动 (litematic-viewer/client)

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
    REACT_APP_API_URL=http://localhost:3001/api # 后端 API 地址
    ```
    * **重启开发服务器** 以加载 `.env` 文件。
*   **启动前端开发服务器**:
    ```bash
    npm start
    ```
*   前端应用默认运行在 `http://localhost:3000`。如果端口与渲染服务器冲突，请修改 `client/.env` 中的 `PORT` (例如 `PORT=3001`) 或 `package.json` 的 `start` 脚本。

### 7. 访问应用

打开浏览器，访问前端运行的地址 (例如 `http://localhost:3001`，如果修改了端口)。

### 8. 功能使用 (通过前端 UI)

*   **上传**: 点击 "上传原理图"。
*   **搜索**: 使用搜索框。
*   **查看详情**: 点击列表项。
*   **编辑/删除**: 点击相应按钮。

## 后端 API 使用说明 (litematic-viewer)

可以直接与 `litematic-viewer` 后端 API 进行交互 (默认地址: `http://localhost:3001/api/schematics`)。

*   **`POST /upload`**
    *   上传 `.litematic` 文件。
    *   请求类型: `multipart/form-data`
    *   表单字段: `file` (包含 `.litematic` 文件)
    *   成功响应: 包含原理图信息的 JSON 对象。
    *   失败响应: 错误信息。

*   **`GET /search?q={searchTerm}`**
    *   根据名称搜索原理图。
    *   查询参数: `q` (可选，搜索关键词)
    *   响应: 包含匹配原理图信息的 JSON 数组。

*   **`GET /`**
    *   获取所有原理图列表。
    *   响应: 包含所有原理图信息的 JSON 数组。

*   **`GET /:id`**
    *   获取指定 ID 的原理图的详细信息 (包括元数据，但不包括预览图或材料列表的实际内容，这些需要单独请求)。
    *   路径参数: `id` (原理图的数据库 ID)
    *   响应: 包含原理图详细信息的 JSON 对象。

*   **`DELETE /:id`**
    *   删除指定 ID 的原理图及其关联的渲染服务器文件。
    *   路径参数: `id`
    *   响应: 成功或失败的消息。

*   **`PUT /:id`**
    *   更新指定 ID 的原理图信息。
    *   路径参数: `id`
    *   请求体 (JSON): `{ "name": "new_schematic_name" }`
    *   响应: 更新后的原理图信息或错误消息。

*   **`GET /:id/front-view`**
    *   获取正视图图片。 (由渲染服务器提供，通过后端代理或重定向)
    *   路径参数: `id`
    *   响应: `image/png`

*   **`GET /:id/side-view`**
    *   获取侧视图图片。
    *   路径参数: `id`
    *   响应: `image/png`

*   **`GET /:id/top-view`**
    *   获取俯视图图片。
    *   路径参数: `id`
    *   响应: `image/png`

*   **`GET /:id/materials`**
    *   获取材料列表 (JSON)。
    *   路径参数: `id`
    *   响应: `application/json` (材料列表数据)

*   **`GET /:id/download`**
    *   下载原始的 `.litematic` 文件。
    *   路径参数: `id`
    *   响应: `application/octet-stream` (文件下载)

## 构建生产版本 (前端)

如果你需要部署前端应用：

*   在 `client` 目录下运行:
    ```bash
    npm run build
    ```
*   构建后的静态文件会生成在 `client/build` 目录中。你可以使用静态文件服务器 (如 `serve`、`nginx` 等) 来部署这些文件。
    ```bash
    # 示例：使用 serve 包运行构建后的文件
    npm install -g serve
    serve -s client/build -l 5000 # 在 5000 端口运行
    ```

## 注意事项

*   **必须运行独立的 `litematic-viewer-server` 渲染服务器**。
*   确保主应用后端 (`litematic-viewer/server`) 可以访问到渲染服务器的 API 地址 (通过 `RENDER_SERVER_URL` 环境变量配置)。
*   数据库连接信息需要正确配置 (通过 `.env` 文件配置)。
*   确保 `litematic-viewer/server/uploads` 目录存在且具有写入权限（如果后端需要存储临时文件或元数据）。
*   注意端口冲突，渲染服务器、主应用后端、主应用前端开发服务器可能需要配置不同的端口。
