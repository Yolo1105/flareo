#!/bin/sh
set -e

echo "Starting Ollama serve in background..."
ollama serve &

echo "Waiting for Ollama serve to start..."
sleep 10

echo "Running llama model..."
# 运行 Llama 模型，不使用 --host、--port 参数（当前版本不支持这些参数）
ollama run llama3.2:1b &

echo "Model started. Entering infinite wait..."
tail -f /dev/null
