import React from 'react';

const TestTenants: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>测试页面 - 租户管理</h1>
      <p>如果看到这个，说明React路由工作正常。</p>
      <p>下一步测试API调用...</p>
      <button onClick={() => {
        fetch('/api/test/tenants')
          .then(r => r.json())
          .then(data => alert(JSON.stringify(data, null, 2)))
          .catch(err => alert('错误: ' + err.message));
      }}>
        测试API调用
      </button>
    </div>
  );
};

export default TestTenants;
