# 使用 Python 3.9 的轻量基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制服务代码
COPY server.py .

# 暴露容器内的 80 端口
EXPOSE 80

# 启动 Flask 服务
CMD ["python", "server.py"]
