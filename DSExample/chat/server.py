# # # from flask import Flask, request, jsonify, render_template_string
# # # import requests  # 确保这一行存在

# # # app = Flask(__name__)

# # # # 模型服务在 Docker Compose 内部的地址
# # # MODEL_SERVICE_URL = "http://model:80/predict"

# # # @app.route('/')
# # # def index():
# # #     html = """
# # #     <!DOCTYPE html>
# # #     <html lang="zh">
# # #     <head>
# # #       <meta charset="UTF-8">
# # #       <title>Deepseek Chatbox</title>
# # #       <style>
# # #         /* 样式代码 */
# # #       </style>
# # #     </head>
# # #     <body>
# # #       <div id="chat-container">
# # #         <h2>Deepseek Chatbox</h2>
# # #         <div id="messages"></div>
# # #         <div id="input-area">
# # #           <input type="text" id="user-input" placeholder="请输入消息" style="width:80%;" />
# # #           <button onclick="sendMessage()">发送</button>
# # #         </div>
# # #       </div>
# # #       <script>
# # #         function sendMessage() {
# # #           var inputField = document.getElementById('user-input');
# # #           var message = inputField.value.trim();
# # #           if (message === '') return;
# # #           appendMessage('user', message);
# # #           inputField.value = '';
          
# # #           fetch('/predict', {
# # #             method: 'POST',
# # #             headers: { 'Content-Type': 'application/json' },
# # #             body: JSON.stringify({ query: message })
# # #           })
# # #           .then(response => response.json())
# # #           .then(data => {
# # #             appendMessage('bot', data.response);
# # #           })
# # #           .catch(error => {
# # #             appendMessage('bot', '错误：无法获得回复');
# # #             console.error('Error:', error);
# # #           });
# # #         }

# # #         function appendMessage(sender, text) {
# # #           var messagesDiv = document.getElementById('messages');
# # #           var msgDiv = document.createElement('div');
# # #           msgDiv.className = 'message ' + sender;
# # #           msgDiv.textContent = (sender === 'user' ? '我：' : '模型：') + text;
# # #           messagesDiv.appendChild(msgDiv);
# # #           messagesDiv.scrollTop = messagesDiv.scrollHeight;
# # #         }
# # #       </script>
# # #     </body>
# # #     </html>
# # #     """
# # #     return render_template_string(html)

# # # @app.route('/predict', methods=['POST'])
# # # def predict():
# # #     data = request.get_json(force=True)
# # #     query = data.get('query', '')
# # #     try:
# # #         # 将请求转发到模型服务
# # #         response = requests.post(MODEL_SERVICE_URL, json={"query": query})
# # #         model_response = response.json().get("response", "无响应")
# # #     except Exception as e:
# # #         model_response = "模型调用失败：" + str(e)
# # #     return jsonify({'response': model_response})

# # # if __name__ == '__main__':
# # #     app.run(host='0.0.0.0', port=80)
# # from flask import Flask, request, jsonify, render_template_string
# # import requests

# # app = Flask(__name__)

# # # 更新为模型服务实际监听的地址和端口，以及正确的 API 路径
# # MODEL_SERVICE_URL = "http://model:11434/v1/chat/completions"

# # @app.route('/')
# # def index():
# #     html = """
# #     <!DOCTYPE html>
# #     <html lang="zh">
# #     <head>
# #       <meta charset="UTF-8">
# #       <title>Deepseek Chatbox</title>
# #       <style>
# #         body { font-family: Arial, sans-serif; margin: 0; padding: 10px; background: #f5f5f5; }
# #         #chat-container { width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 10px; background: #fff; }
# #         #messages { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 5px; }
# #         .message { margin: 5px 0; }
# #         .user { color: blue; }
# #         .bot { color: green; }
# #         #input-area { margin-top: 10px; }
# #       </style>
# #     </head>
# #     <body>
# #       <div id="chat-container">
# #         <h2>Deepseek Chatbox</h2>
# #         <div id="messages"></div>
# #         <div id="input-area">
# #           <input type="text" id="user-input" placeholder="请输入消息" style="width:80%;" />
# #           <button onclick="sendMessage()">发送</button>
# #         </div>
# #       </div>
# #       <script>
# #         function sendMessage() {
# #           var inputField = document.getElementById('user-input');
# #           var message = inputField.value.trim();
# #           if (message === '') return;
# #           appendMessage('user', message);
# #           inputField.value = '';
          
# #           fetch('/predict', {
# #             method: 'POST',
# #             headers: { 'Content-Type': 'application/json' },
# #             body: JSON.stringify({ query: message })
# #           })
# #           .then(response => response.json())
# #           .then(data => {
# #             appendMessage('bot', data.response);
# #           })
# #           .catch(error => {
# #             appendMessage('bot', '错误：无法获得回复');
# #             console.error('Error:', error);
# #           });
# #         }

# #         function appendMessage(sender, text) {
# #           var messagesDiv = document.getElementById('messages');
# #           var msgDiv = document.createElement('div');
# #           msgDiv.className = 'message ' + sender;
# #           msgDiv.textContent = (sender === 'user' ? '我：' : '模型：') + text;
# #           messagesDiv.appendChild(msgDiv);
# #           messagesDiv.scrollTop = messagesDiv.scrollHeight;
# #         }
# #       </script>
# #     </body>
# #     </html>
# #     """
# #     return render_template_string(html)

# # # @app.route('/predict', methods=['POST'])
# # # def predict():
# # #     data = request.get_json(force=True)
# # #     query = data.get('query', '')
# # #     try:
# # #         # 构造请求 payload（请根据 Ollama API 文档调整参数）
# # #         payload = {
# # #             "messages": [{"role": "user", "content": query}],
# # #             "model": "deepseek-r1:1.5b",
# # #             "temperature": 0.7,
# # #             "max_tokens": 100
# # #         }
# # #         response = requests.post(MODEL_SERVICE_URL, json=payload)
# # #         # 假设 API 返回数据格式如下：
# # #         # {"choices": [{"message": {"role": "assistant", "content": "回复文本"}}]}
# # #         choices = response.json().get("choices", [])
# # #         if choices:
# # #             model_response = choices[0].get("message", {}).get("content", "No content")
# # #         else:
# # #             model_response = "No choices in response"
# # #     except Exception as e:
# # #         model_response = "模型调用失败：" + str(e)
# # #     return jsonify({'response': model_response})
# # @app.route('/predict', methods=['POST'])
# # def predict():
# #     data = request.get_json(force=True)
# #     query = data.get('query', '')
# #     try:
# #         payload = {
# #             "messages": [{"role": "user", "content": query}],
# #             "model": "deepseek-r1:1.5b",
# #             "temperature": 0.7,
# #             "max_tokens": 100
# #         }
# #         response = requests.post("http://model:11434/v1/chat/completions", json=payload)
# #         result = response.json()
# #         print("Raw API response:", result)  # 用于调试，观察完整返回数据
# #         choices = result.get("choices", [])
# #         if choices:
# #             # 假设返回的结构为 {"choices": [{"message": {"content": "回复文本"}}]}
# #             model_response = choices[0].get("message", {}).get("content", "No content")
# #         else:
# #             model_response = "No choices in response"
# #     except Exception as e:
# #         model_response = "模型调用失败：" + str(e)
# #     return jsonify({'response': model_response})

# # if __name__ == '__main__':
# #     app.run(host='0.0.0.0', port=80)
# from flask import Flask, request, jsonify, render_template_string
# import requests

# app = Flask(__name__)

# # 使用 /v1/completions 接口，注意这里使用模型服务内部监听的端口（11434）
# MODEL_SERVICE_URL = "http://model:11434/v1/completions"

# @app.route('/')
# def index():
#     html = """
#     <!DOCTYPE html>
#     <html lang="zh">
#     <head>
#       <meta charset="UTF-8">
#       <title>Deepseek Chatbox</title>
#       <style>
#         body { font-family: Arial, sans-serif; margin: 0; padding: 10px; background: #f5f5f5; }
#         #chat-container { width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 10px; background: #fff; }
#         #messages { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 5px; }
#         .message { margin: 5px 0; }
#         .user { color: blue; }
#         .bot { color: green; }
#         #input-area { margin-top: 10px; }
#       </style>
#     </head>
#     <body>
#       <div id="chat-container">
#         <h2>Deepseek Chatbox</h2>
#         <div id="messages"></div>
#         <div id="input-area">
#           <input type="text" id="user-input" placeholder="请输入消息" style="width:80%;" />
#           <button onclick="sendMessage()">发送</button>
#         </div>
#       </div>
#       <script>
#         function sendMessage() {
#           var inputField = document.getElementById('user-input');
#           var message = inputField.value.trim();
#           if (message === '') return;
#           appendMessage('user', message);
#           inputField.value = '';
          
#           // 调用 /predict 接口
#           fetch('/predict', {
#             method: 'POST',
#             headers: { 'Content-Type': 'application/json' },
#             body: JSON.stringify({ query: message })
#           })
#           .then(response => response.json())
#           .then(data => {
#             appendMessage('bot', data.response);
#           })
#           .catch(error => {
#             appendMessage('bot', '错误：无法获得回复');
#             console.error('Error:', error);
#           });
#         }

#         function appendMessage(sender, text) {
#           var messagesDiv = document.getElementById('messages');
#           var msgDiv = document.createElement('div');
#           msgDiv.className = 'message ' + sender;
#           msgDiv.textContent = (sender === 'user' ? '我：' : '模型：') + text;
#           messagesDiv.appendChild(msgDiv);
#           messagesDiv.scrollTop = messagesDiv.scrollHeight;
#         }
#       </script>
#     </body>
#     </html>
#     """
#     return render_template_string(html)

# @app.route('/predict', methods=['POST'])
# def predict():
#     data = request.get_json(force=True)
#     query = data.get('query', '')
#     try:
#         # 构造请求负载，使用简单的 prompt 方式
#         payload = {
#             "prompt": query,
#             "model": "deepseek-r1:1.5b",
#             "temperature": 0.7,
#             "max_tokens": 100
#         }
#         response = requests.post(MODEL_SERVICE_URL, json=payload)
#         # 假设返回格式为 {"choices": [{"text": "回复文本"}]}
#         result = response.json()
#         print("Raw API response:", result)  # 可用于调试
#         choices = result.get("choices", [])
#         if choices:
#             model_response = choices[0].get("text", "No text")
#         else:
#             model_response = "No choices in response"
#     except Exception as e:
#         model_response = "模型调用失败：" + str(e)
#     return jsonify({'response': model_response})

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=80)
from flask import Flask, request, jsonify, render_template_string
import requests

app = Flask(__name__)

# 使用模型服务内部监听的端口 11434，调用 /v1/chat/completions 接口
MODEL_SERVICE_URL = "http://model:11434/v1/chat/completions"

@app.route('/')
def index():
    html = """
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <title>Deepseek Chatbox</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 10px; background: #f5f5f5; }
        #chat-container { width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 10px; background: #fff; }
        #messages { height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 5px; }
        .message { margin: 5px 0; }
        .user { color: blue; }
        .bot { color: green; }
        #input-area { margin-top: 10px; }
      </style>
    </head>
    <body>
      <div id="chat-container">
        <h2>Deepseek Chatbox</h2>
        <div id="messages"></div>
        <div id="input-area">
          <input type="text" id="user-input" placeholder="请输入消息" style="width:80%;" />
          <button onclick="sendMessage()">发送</button>
        </div>
      </div>
      <script>
        function sendMessage() {
          var inputField = document.getElementById('user-input');
          var message = inputField.value.trim();
          if (message === '') return;
          appendMessage('user', message);
          inputField.value = '';
          
          fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: message })
          })
          .then(response => response.json())
          .then(data => {
            appendMessage('bot', data.response);
          })
          .catch(error => {
            appendMessage('bot', '错误：无法获得回复');
            console.error('Error:', error);
          });
        }

        function appendMessage(sender, text) {
          var messagesDiv = document.getElementById('messages');
          var msgDiv = document.createElement('div');
          msgDiv.className = 'message ' + sender;
          msgDiv.textContent = (sender === 'user' ? '我：' : '模型：') + text;
          messagesDiv.appendChild(msgDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      </script>
    </body>
    </html>
    """
    return render_template_string(html)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    query = data.get('query', '')
    try:
        payload = {
            "messages": [{"role": "user", "content": query}],
            "model": "deepseek-r1:1.5b",
            "temperature": 0.7,
            "max_tokens": 100
        }
        response = requests.post(MODEL_SERVICE_URL, json=payload)
        result = response.json()
        print("Raw API response:", result)  # 用于调试，观察返回的数据结构
        choices = result.get("choices", [])
        if choices:
            # 根据返回结构提取回复；如果返回结构与此不同，请调整解析逻辑
            model_response = choices[0].get("message", {}).get("content", "No content")
        else:
            model_response = "No choices in response"
    except Exception as e:
        model_response = "模型调用失败：" + str(e)
    return jsonify({'response': model_response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
