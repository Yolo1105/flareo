"use client"

export default function GuideTab() {
  return (
    <div className="prose max-w-none">
      <h3 className="text-xl font-semibold mb-4">快速入门</h3>
      <p className="text-neutral-700">本指南将帮助您快速上手数据可视化工具包，从安装到创建第一个图表。</p>

      <h4 className="text-lg font-medium mt-6 mb-3">1. 安装</h4>
      <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-md overflow-x-auto">
        <code>npm install data-viz-toolkit</code>
      </pre>

      <h4 className="text-lg font-medium mt-6 mb-3">2. 基本使用</h4>
      <p className="text-neutral-700">导入并使用组件创建您的第一个图表：</p>
      <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-md overflow-x-auto">
        <code>{`import { LineChart } from 'data-viz-toolkit';

function MyChart() {
  const data = [
    { month: 'Jan', value: 100 },
    { month: 'Feb', value: 150 },
    { month: 'Mar', value: 120 },
    { month: 'Apr', value: 180 },
  ];

  return (
    <LineChart 
      data={data}
      xField="month"
      yField="value"
      title="Monthly Performance"
    />
  );
}`}</code>
      </pre>

      <h4 className="text-lg font-medium mt-6 mb-3">3. 自定义样式</h4>
      <p className="text-neutral-700">您可以通过主题和样式选项自定义图表外观：</p>
      <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-md overflow-x-auto">
        <code>{`<LineChart 
  data={data}
  xField="month"
  yField="value"
  title="Monthly Performance"
  theme="dark"
  colors={['#4f46e5', '#10b981']}
  animation={true}
  responsive={true}
/>`}</code>
      </pre>

      <h3 className="text-xl font-semibold mt-8 mb-4">常见问题</h3>

      <h4 className="text-lg font-medium mt-6 mb-3">如何处理大数据集？</h4>
      <p className="text-neutral-700">对于大数据集，建议使用数据采样或聚合功能：</p>
      <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-md overflow-x-auto">
        <code>{`import { LineChart, dataSampling } from 'data-viz-toolkit';

// 对大数据集进行采样
const sampledData = dataSampling(largeDataset, 100);

<LineChart 
  data={sampledData}
  // 其他配置
/>`}</code>
      </pre>

      <h4 className="text-lg font-medium mt-6 mb-3">如何实现实时更新？</h4>
      <p className="text-neutral-700">您可以结合React的状态管理和WebSocket实现实时数据更新：</p>
      <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-md overflow-x-auto">
        <code>{`import { useState, useEffect } from 'react';
import { LineChart } from 'data-viz-toolkit';

function RealtimeChart() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // 设置WebSocket连接
    const ws = new WebSocket('wss://your-api.com/data');
    
    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(currentData => [...currentData, newData]);
    };
    
    return () => ws.close();
  }, []);
  
  return (
    <LineChart 
      data={data}
      realtime={true}
      // 其他配置
    />
  );
}`}</code>
      </pre>
    </div>
  )
}
