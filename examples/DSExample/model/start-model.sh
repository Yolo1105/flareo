#!/bin/sh
set -e

echo "Starting Ollama serve in background..."
ollama serve &

echo "Waiting for Ollama serve to start..."
sleep 10

echo "Running deepseek model..."
# 注意：移除了 --host、--port 参数，因为这些参数不受支持
ollama run deepseek-r1:1.5b &

echo "Model started. Entering infinite wait..."
tail -f /dev/null
