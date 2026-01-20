import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BabyService } from '../services/api';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await BabyService.loginDev();
      await BabyService.ensureDevEnvironment();
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bd-app" style={{ minHeight: '100vh' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', minHeight: '100vh' }}>
        <div style={{ padding: 60 }}>
          <div className="bd-logo">BabyDaily</div>
          <p style={{ marginTop: 18, color: '#6b524b', maxWidth: 420 }}>
            轻奢而温柔的记录空间，帮你留住每一个小变化。
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#fff8f5, #f9f0ec)' }}>
          <div className="bd-card" style={{ width: 360 }}>
            <h2 className="bd-title" style={{ fontSize: 28 }}>欢迎回来</h2>
            <div style={{ margin: '14px 0' }}>
              <TextBox placeholder="手机号或邮箱" stylingMode="outlined" />
            </div>
            <div style={{ margin: '14px 0' }}>
              <TextBox mode="password" placeholder="密码" stylingMode="outlined" />
            </div>
            <Button text={loading ? '登录中...' : '登录'} type="default" width="100%" height={44} stylingMode="contained" onClick={handleLogin} disabled={loading} />
            <div style={{ marginTop: 12, fontSize: 12, color: '#7a625a' }}>支持开发登录与微信登录</div>
          </div>
        </div>
      </div>
    </div>
  );
};
