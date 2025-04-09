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

### 2. 克隆项目

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

### 3. 渲染服务器配置与启动 (litematic-viewer-server)

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
*   渲染服务器默认运行在 `http://localhost:3000` (请根据 `litematic-viewer-server` 的文档确认或修改端口)。 **请确保此服务器正在运行，否则主应用无法处理原理图。**

### 4. 后端配置与启动 (litematic-viewer)

*   **进入主应用后端目录**:
    ```bash
    cd path/to/litematic-viewer
    ```
*   **安装依赖**:
    ```bash
    npm install
    ```
*   **数据库配置**:
    *   在 `server/config/` 目录下创建或修改数据库配置文件（例如 `db.config.js`）。
    *   配置正确的 MySQL 主机、端口、用户名、密码和数据库名。
    *   **重要**: 确保数据库和所需的表结构已创建。
*   **(可能需要) 配置渲染服务器地址**: 检查 `litematic-viewer` 的后端代码 (可能在 `server/controllers` 或 `server/services` 中)，确保它调用的渲染服务器 API 地址 (`http://localhost:3000/api/...`) 是正确的。
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

### 5. 前端配置与启动 (litematic-viewer/client)

*   **进入 client 目录**:
    ```bash
    cd client
    ```
*   **安装依赖**:
    ```bash
    npm install
    ```
*   **启动前端开发服务器**:
    ```bash
    npm start
    ```
*   前端应用默认运行在 `http://localhost:3000`。**注意**：如果渲染服务器也使用 3000 端口，你需要修改其中一个的端口以避免冲突。可以通过修改 `client/package.json` 的 `start` 脚本或使用 `.env` 文件来修改前端端口，例如：`PORT=3001 npm start` 或在 `.env` 文件中加入 `PORT=3001`。假设你将前端端口改为 3001。

### 6. 访问应用

打开浏览器，访问前端运行的地址 (例如 `http://localhost:3001`)。

### 7. 功能使用

*   **上传**: 点击 "上传原理图" 按钮选择本地的 `.litematic` 文件进行上传。文件将被发送到后端 (`litematic-viewer`)，后端再调用渲染服务器 (`litematic-viewer-server`) 进行处理。
*   **搜索**: 在搜索框中输入原理图名称的关键字进行搜索。
*   **查看详情**: 点击列表中的任意原理图条目，会弹出详细信息对话框，展示由渲染服务器生成的预览图和材料列表。
*   **编辑**: 点击原理图条目旁边的编辑按钮，可以修改原理图的名称。
*   **删除**: 点击原理图条目旁边的删除按钮，可以删除该原理图及其相关文件。

### 8. 构建生产版本 (前端)

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
*   确保主应用后端 (`litematic-viewer/server`) 可以访问到渲染服务器的 API 地址。
*   数据库连接信息需要正确配置。
*   确保 `litematic-viewer/server/uploads` 目录存在且具有写入权限（如果后端需要存储临时文件或元数据）。
*   注意端口冲突，渲染服务器、主应用后端、主应用前端开发服务器可能需要配置不同的端口。
