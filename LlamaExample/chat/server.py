# from flask import Flask, request, jsonify, render_template_string
# import requests

# app = Flask(__name__)

# # 使用模型服务内部监听的端口 11434，调用 /v1/chat/completions 接口
# MODEL_SERVICE_URL = "http://model:11434/v1/chat/completions"

# @app.route('/')
# def index():
#     html = """
#     <!DOCTYPE html>
#     <html lang="zh">
#     <head>
#       <meta charset="UTF-8">
#       <title>Llama3.2:1b Chatbox</title>
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
#         <h2>Llama Chatbox</h2>
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
#         payload = {
#             "messages": [{"role": "user", "content": query}],
#             "model": "llama3.2:1b",
#             "temperature": 0.7,
#             "max_tokens": 100
#         }
#         response = requests.post(MODEL_SERVICE_URL, json=payload)
#         result = response.json()
#         print("Raw API response:", result)  # 用于调试，观察返回的数据结构
#         choices = result.get("choices", [])
#         if choices:
#             # 根据返回结构提取回复；如果返回结构与此不同，请调整解析逻辑
#             model_response = choices[0].get("message", {}).get("content", "No content")
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

# 使用模型服务内部监听的端口 11434 调用 /v1/chat/completions 接口
MODEL_SERVICE_URL = "http://model:11434/v1/chat/completions"

@app.route('/')
def index():
    html = """
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <title>Llama Chatbox</title>
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
        <h2>Llama Chatbox</h2>
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
        # 构造请求负载，采用聊天 API 的格式
        payload = {
            "messages": [{"role": "user", "content": query}],
            "model": "llama3.2:1b",
            "temperature": 0.7,
            "max_tokens": 100
        }
        response = requests.post(MODEL_SERVICE_URL, json=payload)
        result = response.json()
        print("Raw API response:", result)  # 用于调试，查看返回的原始数据
        choices = result.get("choices", [])
        if choices:
            model_response = choices[0].get("message", {}).get("content", "No content")
        else:
            model_response = "No choices in response"
    except Exception as e:
        model_response = "模型调用失败：" + str(e)
    return jsonify({'response': model_response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
