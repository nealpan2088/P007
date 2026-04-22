import React, { useEffect, useState } from 'react';

const TestPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('TestPage: 开始获取数据');
    fetch('/api/test/tenants')
      .then(r => r.json())
      .then(result => {
        console.log('TestPage: 获取到数据', result);
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error('TestPage: 获取数据错误', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1>测试页面</h1>
      <p>API响应: {data?.success ? '成功' : '失败'}</p>
      <p>消息: {data?.message}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default TestPage;
