# Random Quote Module

这个示例展示了如何使用 Docker 将一个简单的前端模块容器化。模块内容为一个随机名言生成器，可以通过 iframe 等方式嵌入到其他 HTML 页面中作为插件使用。

## 项目结构

```
random-quote/
├── Dockerfile    # Docker 构建配置文件
├── index.html    # 随机名言模块的页面（将作为插件展示）
└── test.html     # 测试页面，通过 iframe 引入 index.html 中的模块
```

## 前置条件

- 安装并启动 Docker
- 使用支持 HTML 的现代浏览器（例如 Chrome、Firefox 等）

## 如何运行示例

1. **启动 Docker**  
   确保 Docker 已启动并正在运行。

2. **构建 Docker 镜像**  
   在项目根目录（包含 Dockerfile 的目录）打开终端，执行以下命令：
   ```bash
   docker build -t random-quote-module .
   ```

3. **运行 Docker 容器**  
   使用下面的命令启动容器，将容器的 80 端口映射到本机的 8080 端口：
   ```bash
   docker run -d -p 8080:80 random-quote-module
   ```

4. **查看插件效果**  
   打开 `test.html` 文件。在该文件中，我们通过 iframe 引用了 `http://localhost:8080`，这样就能在 `test.html` 中看到 `index.html` 的内容（即随机名言模块）。

## 示例文件说明

- **index.html**  
  包含随机名言模块的前端代码。页面加载时显示提示文字，通过点击按钮可以随机切换名言。

- **test.html**  
  示例测试页面，通过 iframe 嵌入 `index.html` 提供的模块：
  ```html
  <!DOCTYPE html>
  <html lang="zh">
  <head>
    <meta charset="UTF-8">
    <title>引用随机名言模块</title>
  </head>
  <body>
    <h1>主页面</h1>
    <!-- 通过 iframe 引入随机名言模块 -->
    <iframe src="http://localhost:8080" width="600" height="400" frameborder="0"></iframe>
  </body>
  </html>
  ```

## 停止并删除容器

- **停止容器**  
  首先使用 `docker ps` 命令查看正在运行的容器，然后使用以下命令停止容器：
  ```bash
  docker stop <容器ID>
  ```
  例如：
  ```bash
  docker stop c69b86e170aa
  ```

- **删除容器**  
  停止后删除容器：
  ```bash
  docker rm <容器ID>
  ```
  或者直接强制删除正在运行的容器：
  ```bash
  docker rm -f <容器ID>
  ```

## 故障排查

- **页面无显示或错误**  
  - 直接在浏览器中访问 [http://localhost:8080](http://localhost:8080) 查看 `index.html` 是否正常显示。
  - 检查 Docker 容器状态：  
    ```bash
    docker ps
    ```
  - 查看容器日志：
    ```bash
    docker logs <容器ID>
    ```

- **网络问题**  
  确保 Docker 容器能够访问外部资源（例如引用的外部 CSS 或 JS 库）。

---

通过以上步骤，你就可以成功构建并运行一个通过 Docker 容器化的随机名言模块，并在 `test.html` 中作为插件进行引用。欢迎根据需求对示例进行扩展和修改！