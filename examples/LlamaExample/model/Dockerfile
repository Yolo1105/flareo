# 使用 Ollama 官方镜像作为基础镜像
FROM ollama/ollama:latest

# 安装 NVIDIA CUDA 及相关依赖（如果需要 GPU 加速）
RUN apt update && apt install -y \
    nvidia-cuda-toolkit \
    nvidia-utils-535 \
    && rm -rf /var/lib/apt/lists/*

# 验证 GPU 可用性
RUN nvidia-smi || echo "NVIDIA-SMI failed but should work at runtime."

# 复制自定义入口脚本到容器内
COPY start-model.sh /app/start-model.sh
RUN chmod +x /app/start-model.sh

# 覆盖基础镜像的 ENTRYPOINT，使脚本直接执行
ENTRYPOINT []

# 设置启动命令为我们的入口脚本
CMD ["/app/start-model.sh"]
