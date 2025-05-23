下面提供一个完整的 README 示例，详细描述了如何复现（replicate） DSExample 项目，即同时启动 Llama 模型服务与聊天模块，并将其嵌入网站中。你可以将下列内容保存为 `README.md` 文件。

---

# LlamaExample – Llama Chatbox Example

本项目展示了如何使用 Docker 和 Docker Compose 部署一个基于 Llama3.2 模型的聊天模块（Llama Chatbox），并可作为小型 Web 模块轻松嵌入到其他网站中。

## 项目结构

```
LlamaExample/
├── docker-compose.yml         # Docker Compose 配置文件，用于同时启动模型服务和聊天服务
├── model/
│   ├── Dockerfile             # 模型服务容器 Dockerfile（基于 Ollama 镜像）
│   └── start-model.sh         # 模型服务入口脚本，用于先启动 Ollama serve，再加载 Llama 模型
└── chat/
    ├── Dockerfile             # 聊天服务容器 Dockerfile（基于 Python 3.9-slim 和 Flask）
    ├── requirements.txt       # 聊天服务依赖列表（Flask、requests、gunicorn 等）
    └── server.py              # 聊天服务后端代码，提供聊天界面和 /predict 接口，用于转发用户请求到模型服务
```

## 前置条件

- 安装 [Docker](https://docs.docker.com/get-docker/)
- 安装 [Docker Compose](https://docs.docker.com/compose/install/)

## 快速开始

1. **克隆项目**

   克隆本项目代码到本地：
   ```bash
   git clone <项目仓库地址>
   cd LlamaExample
   ```

2. **构建并启动所有容器**

   使用 Docker Compose 一键构建并启动所有服务：
   ```bash
   docker-compose up --build -d
   ```
   - 该命令会构建两个容器：
     - **模型服务容器（model）**：基于 `ollama/ollama:latest` 镜像，通过自定义入口脚本启动 `ollama serve`，等待后再执行 `ollama run llama3.2:1b` 加载 Llama 模型，并保持容器长驻。
     - **聊天服务容器（chat）**：基于 Python 3.9-slim 和 Flask，提供 Web 聊天界面，并在 `/predict` 接口中转发请求给模型服务。
   - 两个容器通过 Docker Compose 默认网络（以及我们在 `docker-compose.yml` 中显式定义的 `dsnet` 网络）互联，在内部聊天服务可以通过 `http://model:11434` 调用模型服务 API。

3. **验证服务运行**

   - 在浏览器中访问：[http://localhost:8080](http://localhost:8080)  
     你将看到 Llama Chatbox 的聊天界面。
   - 在聊天框中输入消息后，聊天服务会将请求转发到模型服务，并显示生成的回复（如返回的回复为空，则可能需要根据 API 返回格式调整代码）。

4. **查看日志进行调试**

   - 查看聊天服务容器日志：
     ```bash
     docker logs llamaexample-chat-1
     ```
   - 查看模型服务容器日志：
     ```bash
     docker logs model
     ```
   - 聊天服务中已内置打印原始 API 返回数据（通过 `print("Raw API response:", result)`），可以帮助调试返回的数据结构。

## 嵌入到你的网站

将该聊天模块作为 Web 模块嵌入你的网站非常简单。最常用的方式是通过 iframe 嵌入：

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>我的网站</title>
</head>
<body>
  <h1>欢迎来到我的网站</h1>
  <!-- 嵌入 Llama Chatbox 模块 -->
  <iframe src="http://你的服务器地址:8080" width="600" height="500" frameborder="0"></iframe>
</body>
</html>
```

请将 `http://你的服务器地址:8080` 替换为你部署 LlamaExample 服务的实际地址（本机测试时为 `http://localhost:8080`，部署到线上时为相应域名或 IP）。

## 详细说明

### 模型服务容器

- **Dockerfile（model/Dockerfile）**  
  - 基于 `ollama/ollama:latest` 镜像构建
  - 安装 NVIDIA CUDA 相关依赖（如需要 GPU 加速）
  - 复制并赋予入口脚本 `start-model.sh` 可执行权限
  - 通过 `ENTRYPOINT []` 覆盖基础镜像的默认 ENTRYPOINT，确保自定义脚本能直接执行

- **入口脚本（model/start-model.sh）**  
  脚本内容示例如下：
  ```sh
  #!/bin/sh
  set -e

  echo "Starting Ollama serve in background..."
  ollama serve &

  echo "Waiting for Ollama serve to start..."
  sleep 10

  echo "Running Llama model..."
  # 注意：移除不支持的 --host 参数
  ollama run llama3.2:1b &

  echo "Model started. Entering infinite wait..."
  tail -f /dev/null
  ```
  该脚本确保先后台启动 `ollama serve`，等待启动后加载 Llama 模型，然后通过 `tail -f /dev/null` 保持容器长驻。

### 聊天服务容器

- **Dockerfile（chat/Dockerfile）**  
  - 基于 `python:3.9-slim` 镜像构建
  - 复制 `requirements.txt` 并安装依赖（Flask、requests、gunicorn 等）
  - 复制 `server.py`（提供聊天界面和 `/predict` 接口）

- **服务器代码（chat/server.py）**  
  - 提供基本的聊天界面，使用 AJAX 调用 `/predict` 接口
  - `/predict` 接口构造请求负载，并调用模型服务（例如 `/v1/chat/completions` 或 `/v1/completions`，根据实际 API 选择）
  - 内置打印原始 API 返回数据，便于调试和调整解析逻辑

### Docker Compose 配置

`docker-compose.yml` 中定义了两个服务，并将它们放在同一网络中（`dsnet`），保证服务名称互相可解析：
```yaml
version: '3'
services:
  model:
    build: ./model
    container_name: model
    hostname: model
    ports:
      - "9000:11434"
    networks:
      - dsnet

  chat:
    build: ./chat
    ports:
      - "8080:80"
    depends_on:
      - model
    networks:
      - dsnet

networks:
  dsnet:
    driver: bridge
```

## 常见问题与排查

- **DNS 解析问题**：  
  确保两个服务在同一 Docker Compose 网络中，并在 `chat/server.py` 中使用 `http://model:11434` 调用模型服务。
- **API 返回格式不符**：  
  如果聊天界面显示 “No choices in response”，请检查聊天容器日志中打印的 “Raw API response:”，并根据实际返回数据结构调整解析代码。
- **服务启动问题**：  
  查看各个容器日志，确保模型服务和聊天服务都已成功启动。

## 总结

本项目提供了一个独立的 Llama Chatbox 模块，可通过 Docker Compose 轻松复现，并能以 iframe 方式嵌入到网站中。通过简单调整 API 接口和参数，即可根据需要扩展和定制该模块。
