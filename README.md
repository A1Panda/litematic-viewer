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
*   渲染服务器默认运行在 `http://localhost:3000` (可在 `.env` 文件中配置 `RENDER_SERVER_URL` 供主应用后端使用)。 **请确保此服务器正在运行。**

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
    REACT_APP_API_URL=http://localhost:3001/api # 后端 API 地址
    ```
    * **重启开发服务器** 以加载 `.env` 文件。
*   **启动前端开发服务器**:
    ```bash
    npm start
    ```
*   前端应用默认运行在 `http://localhost:3000`。如果端口与渲染服务器冲突，请修改 `client/.env` 中的 `PORT` (例如 `PORT=3001`) 或 `package.json` 的 `start` 脚本。

### 6. 访问应用

打开浏览器，访问前端运行的地址 (例如 `http://localhost:3001`，如果修改了端口)。

### 7. 功能使用 (通过前端 UI)

*   **上传**: 点击 "上传原理图"。
*   **搜索**: 使用搜索框。
*   **查看详情**: 点击列表项。
*   **编辑/删除**: 点击相应按钮。

## 后端 API 使用说明 (litematic-viewer)

可以直接与 `litematic-viewer` 后端 API 进行交互 (默认地址: `http://localhost:3001/api/schematics`)。以下是各接口的详细使用示例：

### 原理图上传

**`POST /upload`**
- 上传 `.litematic` 文件
- 请求类型: `multipart/form-data`
- 表单字段: `file` (包含 `.litematic` 文件)

**示例 (使用curl):**
```bash
curl -X POST -F "file=@path/to/your_schematic.litematic" http://localhost:3001/api/schematics/upload
```

**示例 (使用JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('file', fileObject); // fileObject 是从文件输入获取的文件对象

fetch('http://localhost:3001/api/schematics/upload', {
  method: 'POST',
  body: formData,
})
.then(response => response.json())
.then(data => console.log('上传成功:', data))
.catch(error => console.error('上传失败:', error));
```

**成功响应示例:**
```json
{
  "id": 123,
  "name": "your_schematic",
  "originalName": "your_schematic.litematic",
  "filePath": "/path/to/storage/your_schematic.litematic",
  "uploadDate": "2023-09-15T08:30:45.000Z",
  "userId": 1
}
```

### 搜索原理图

**`GET /search?q={searchTerm}`**
- 根据名称搜索原理图
- 查询参数: `q` (搜索关键词)

**示例 (使用curl):**
```bash
curl "http://localhost:3001/api/schematics/search?q=farm"
```

**示例 (使用JavaScript/Fetch):**
```javascript
fetch('http://localhost:3001/api/schematics/search?q=farm')
  .then(response => response.json())
  .then(data => console.log('搜索结果:', data))
  .catch(error => console.error('搜索失败:', error));
```

**响应示例:**
```json
[
  {
    "id": 123,
    "name": "自动农场",
    "originalName": "auto_farm.litematic",
    "uploadDate": "2023-09-15T08:30:45.000Z",
    "userId": 1
  },
  {
    "id": 124,
    "name": "小麦农场",
    "originalName": "wheat_farm.litematic",
    "uploadDate": "2023-09-16T10:22:30.000Z",
    "userId": 1
  }
]
```

### 获取所有原理图

**`GET /`**
- 获取所有原理图列表

**示例 (使用curl):**
```bash
curl http://localhost:3001/api/schematics
```

**示例 (使用JavaScript/Fetch):**
```javascript
fetch('http://localhost:3001/api/schematics')
  .then(response => response.json())
  .then(data => console.log('所有原理图:', data))
  .catch(error => console.error('获取失败:', error));
```

**响应格式与搜索接口相同**

### 获取单个原理图详情

**`GET /:id`**
- 获取指定ID的原理图详细信息
- 路径参数: `id` (原理图的数据库ID)

**示例 (使用curl):**
```bash
curl http://localhost:3001/api/schematics/123
```

**示例 (使用JavaScript/Fetch):**
```javascript
fetch('http://localhost:3001/api/schematics/123')
  .then(response => response.json())
  .then(data => console.log('原理图详情:', data))
  .catch(error => console.error('获取详情失败:', error));
```

**响应示例:**
```json
{
  "id": 123,
  "name": "自动农场",
  "originalName": "auto_farm.litematic",
  "filePath": "/path/to/storage/auto_farm.litematic",
  "uploadDate": "2023-09-15T08:30:45.000Z",
  "dimensions": {
    "width": 15,
    "height": 10,
    "length": 20
  },
  "userId": 1,
  "username": "minecraft玩家"
}
```

### 删除原理图

**`DELETE /:id`**
- 删除指定ID的原理图及其关联文件
- 路径参数: `id`

**示例 (使用curl):**
```bash
curl -X DELETE http://localhost:3001/api/schematics/123
```

**示例 (使用JavaScript/Fetch):**
```javascript
fetch('http://localhost:3001/api/schematics/123', {
  method: 'DELETE',
})
.then(response => response.json())
.then(data => console.log('删除结果:', data))
.catch(error => console.error('删除失败:', error));
```

**响应示例:**
```json
{
  "message": "原理图删除成功"
}
```

### 更新原理图信息

**`PUT /:id`**
- 更新指定ID的原理图信息
- 路径参数: `id`
- 请求体 (JSON): 包含要更新的字段

**示例 (使用curl):**
```bash
curl -X PUT -H "Content-Type: application/json" -d '{"name":"更新后的名称"}' http://localhost:3001/api/schematics/123
```

**示例 (使用JavaScript/Fetch):**
```javascript
fetch('http://localhost:3001/api/schematics/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: '更新后的名称'
  }),
})
.then(response => response.json())
.then(data => console.log('更新结果:', data))
.catch(error => console.error('更新失败:', error));
```

**响应示例:**
```json
{
  "id": 123,
  "name": "更新后的名称",
  "originalName": "auto_farm.litematic",
  "uploadDate": "2023-09-15T08:30:45.000Z",
  "userId": 1
}
```

### 获取原理图预览图

**获取正视图:**
```
GET /:id/front-view
```

**获取侧视图:**
```
GET /:id/side-view
```

**获取俯视图:**
```
GET /:id/top-view
```

所有预览图API都返回PNG格式图片。

**示例 (使用img标签):**
```html
<img src="http://localhost:3001/api/schematics/123/top-view" alt="俯视图">
<img src="http://localhost:3001/api/schematics/123/front-view" alt="正视图">
<img src="http://localhost:3001/api/schematics/123/side-view" alt="侧视图">
```

**示例 (使用JavaScript获取):**
```javascript
// 获取图片并转换为blob
fetch('http://localhost:3001/api/schematics/123/top-view')
  .then(response => response.blob())
  .then(blob => {
    const imageUrl = URL.createObjectURL(blob);
    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    document.body.appendChild(imageElement);
  })
  .catch(error => console.error('获取图片失败:', error));
```

### 获取材料列表

**`GET /:id/materials`**
- 获取指定ID原理图的材料列表
- 路径参数: `id`

**示例 (使用curl):**
```bash
curl http://localhost:3001/api/schematics/123/materials
```

**示例 (使用JavaScript/Fetch):**
```javascript
fetch('http://localhost:3001/api/schematics/123/materials')
  .then(response => response.json())
  .then(data => console.log('材料列表:', data))
  .catch(error => console.error('获取材料列表失败:', error));
```

**响应示例:**
```json
[
  {
    "blockId": "minecraft:stone",
    "count": 128,
    "displayName": "石头",
    "boxCount": 2,
    "groupCount": 0,
    "unitCount": 0
  },
  {
    "blockId": "minecraft:oak_planks",
    "count": 64,
    "displayName": "橡木木板",
    "boxCount": 1,
    "groupCount": 0,
    "unitCount": 0
  }
]
```

### 下载原理图文件

**`GET /:id/download`**
- 下载原始的 `.litematic` 文件
- 路径参数: `id`

**示例 (使用curl):**
```bash
curl -O -J http://localhost:3001/api/schematics/123/download
```

**示例 (使用HTML):**
```html
<a href="http://localhost:3001/api/schematics/123/download" download>下载原理图</a>
```

**示例 (使用JavaScript触发下载):**
```javascript
function downloadSchematic(id) {
  window.location.href = `http://localhost:3001/api/schematics/${id}/download`;
}

// 调用函数下载
downloadSchematic(123);
```

## 用户认证接口

### 用户注册

**`POST /api/auth/register`**
- 注册新用户
- 请求体 (JSON): 包含用户信息

**示例 (使用curl):**
```bash
curl -X POST -H "Content-Type: application/json" -d '{"username":"newuser","password":"password123","email":"user@example.com"}' http://localhost:3001/api/auth/register
```

**示例 (使用JavaScript/Fetch):**
```javascript
fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'newuser',
    password: 'password123',
    email: 'user@example.com'
  }),
})
.then(response => response.json())
.then(data => console.log('注册结果:', data))
.catch(error => console.error('注册失败:', error));
```

**响应示例:**
```json
{
  "message": "用户注册成功",
  "user": {
    "id": 5,
    "username": "newuser",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### 用户登录

**`POST /api/auth/login`**
- 用户登录
- 请求体 (JSON): 包含用户名和密码

**示例 (使用curl):**
```bash
curl -X POST -H "Content-Type: application/json" -d '{"username":"newuser","password":"password123"}' http://localhost:3001/api/auth/login
```

**示例 (使用JavaScript/Fetch):**
```javascript
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'newuser',
    password: 'password123'
  }),
})
.then(response => response.json())
.then(data => {
  console.log('登录结果:', data);
  // 保存token到本地存储
  localStorage.setItem('token', data.token);
})
.catch(error => console.error('登录失败:', error));
```

**响应示例:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "username": "newuser",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### 使用认证令牌访问受保护资源

对于需要认证的接口，在请求头中添加认证令牌：

**示例 (使用JavaScript/Fetch):**
```javascript
// 获取存储的token
const token = localStorage.getItem('token');

// 发送带有认证的请求
fetch('http://localhost:3001/api/schematics/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log('上传成功:', data))
.catch(error => console.error('上传失败:', error));
```

## 推荐的API调用顺序

1. 用户注册或登录，获取认证令牌
2. 上传原理图文件
3. 获取或搜索原理图列表
4. 获取单个原理图详情
5. 获取原理图的预览图和材料列表
6. 必要时执行编辑或删除操作

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
