import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const TestPage = () => <div><h1>测试页面成功！</h1><p>React Router工作正常。</p></div>;

function AppTest() {
  return (
    <Router>
      <div>
        <nav>
          <Link to="/">首页</Link> | 
          <Link to="/test">测试页</Link> | 
          <Link to="/tenants">租户页</Link>
        </nav>
        <Routes>
          <Route path="/" element={<div>首页</div>} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/tenants" element={<TestPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppTest;
