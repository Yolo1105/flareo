### **📌 Development Order (Which Files to Edit First)**

### **1️⃣ Initialize the Project**
**Edit / Create:**  
- 📄 `package.json` (Generated via `npm init -y`)  
- 📄 `webpack.config.js` (Setup Webpack)

**Command to run:**
```bash
mkdir my-project && cd my-project
npm init -y
```

---

### **2️⃣ Install Dependencies**
**Command to run:**
```bash
npm install --save-dev webpack webpack-cli html-webpack-plugin html-loader style-loader css-loader babel-loader @babel/core @babel/preset-env @babel/preset-react react react-dom
```

---

### **3️⃣ Set Up Webpack Configuration**
**Edit:**  
- 📄 `webpack.config.js`  
- **Why?** This file ensures Webpack will correctly bundle JavaScript, HTML, and CSS.

**Edit `webpack.config.js` First:**
```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: 'html-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: './',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: 'body',
    }),
  ],
};
```

---

### **4️⃣ Create the HTML Template**
**Edit:**  
- 📄 `public/index.html`  
- **Why?** This will be used as the Webpack template.

**Edit `public/index.html` First:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Webpack + Web Component</title>
</head>
<body>
  <h1>Web Component App</h1>
  <script src="bundle.js"></script>
</body>
</html>
```

---

### **5️⃣ Create the Web Components**
**Edit in Order:**  
- 📄 `src/components/my-component.js`
- 📄 `src/components/react-component.jsx`
- 📄 `src/components/styled-component.js`

**Edit `src/components/my-component.js` First:**
```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: lightblue;
          padding: 10px;
          border-radius: 5px;
        }
        h1 {
          color: darkblue;
        }
      </style>
      <h1>我是一个 Web Component</h1>
    `;
  }
}

customElements.define('my-component', MyComponent);
```

---

### **6️⃣ Define Global CSS**
**Edit:**  
- 📄 `src/styles/global.css`
- 📄 `src/styles/component.css`
- 📄 `src/styles/theme.css`

**Edit `src/styles/global.css` First:**
```css
body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
}
```

---

### **7️⃣ Create the Entry File (`index.js`)**
**Edit:**  
- 📄 `src/index.js`
- **Why?** This file will import all components and styles.

**Edit `src/index.js` First:**
```javascript
import './styles/global.css';
import './components/my-component.js';
import './components/react-component.jsx';

document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML += '<my-component></my-component>';
  document.body.innerHTML += '<react-component></react-component>';
});
```

---

### **8️⃣ Build and Serve**
- **Run Webpack Build**
  ```bash
  npx webpack --mode production
  ```
- **Serve the project**
  ```bash
  npx serve dist
  ```

---

## **📌 Final Development Order**
| Step | File to Edit First | Purpose |
|------|--------------------|---------|
| **1️⃣** | `package.json` (Generated) | Initialize the project |
| **2️⃣** | Install dependencies | Install Webpack & required packages |
| **3️⃣** | `webpack.config.js` | Configure Webpack (most critical step) |
| **4️⃣** | `public/index.html` | HTML template (needed for Webpack output) |
| **5️⃣** | `src/components/my-component.js` | First Web Component |
| **6️⃣** | `src/styles/global.css` | Define global styles |
| **7️⃣** | `src/index.js` | Import and use components |
| **8️⃣** | Run `npx webpack --mode production` | Build the project |
| **9️⃣** | Run `npx serve dist` | Serve and test |

```
my-project/                # 项目根目录
│── src/                   # 源代码目录
│   │── components/        # 存放 Web Components
│   │   │── my-component.js      # 一个普通的 Web Component（HTML + CSS）
│   │   │── styled-component.js  # 使用外部 CSS 的 Web Component
│   │   └── react-component.jsx  # 通过 React 创建的 Web Component
│   │── styles/            # 存放 CSS 文件
│   │   ├── global.css     # 全局 CSS（仅作用于宿主页面）
│   │   ├── component.css  # Web Component 用的 CSS
│   │   └── theme.css      # 主题样式
│   │── index.js           # Webpack 入口文件，导入所有 Web Components 和 React 组件
│   └── index.html         # 宿主 HTML 页面（引用 Webpack 打包后的脚本）
│
│── dist/                  # Webpack 生成的打包文件
│   │── bundle.js          # Webpack 打包后的 JavaScript
│   └── index.html         # 复制的 HTML（可选）
│
│── node_modules/          # npm 依赖目录（自动生成）
│── package.json           # npm 依赖管理文件
│── package-lock.json      # 依赖版本锁定文件
│── webpack.config.js      # Webpack 配置文件
└── README.md              # 项目说明文件
```