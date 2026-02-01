import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BabyService } from '../services/api';
import { useIsMobile } from '../hooks/useIsMobile';

export const Login = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await BabyService.loginDev();
      await BabyService.ensureDevEnvironment();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      alert('登录失败: ' + (err.message || '网络错误'));
    } finally {
      setLoading(false);
    }
  };

  if (isMobile) {
    return (
      <div className="bd-app" style={{ minHeight: '100vh', background: '#fff8f5', display: 'flex', flexDirection: 'column', padding: 24, justifyContent: 'center' }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div className="bd-logo" style={{ fontSize: 32 }}>BabyDaily</div>
          <p style={{ marginTop: 12, color: '#6b524b', fontSize: 14 }}>
            记录每一个小变化
          </p>
        </div>

        <div className="bd-card" style={{ padding: '30px 20px', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}>
          <h2 className="bd-title" style={{ fontSize: 24, marginBottom: 24, textAlign: 'center' }}>欢迎回来</h2>
          <div style={{ margin: '16px 0' }}>
            <TextBox placeholder="手机号或邮箱" stylingMode="outlined" height={44} />
          </div>
          <div style={{ margin: '16px 0' }}>
            <TextBox mode="password" placeholder="密码" stylingMode="outlined" height={44} />
          </div>
          <Button
            text={loading ? '登录中...' : '立即登录'}
            type="default"
            width="100%"
            height={48}
            stylingMode="contained"
            onClick={handleLogin}
            disabled={loading}
          />
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Button text="没有账号？去注册" stylingMode="text" height={36} type="normal" />
          </div>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#999' }}>
          &copy; 2024 BabyDaily
        </div>
      </div>
    );
  }

  return (
    <div className="bd-app" style={{ minHeight: '100vh' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', minHeight: '100vh' }}>
        <div style={{ padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="bd-logo" style={{ fontSize: 48 }}>BabyDaily</div>
          <p style={{ marginTop: 24, color: '#6b524b', maxWidth: 420, fontSize: 18, lineHeight: 1.6 }}>
            轻奢而温柔的记录空间，帮你留住每一个小变化。<br />
            用心记录，让爱有迹可循。
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff8f5 0%, #f9f0ec 100%)' }}>
          <div className="bd-card" style={{ width: 380, padding: 40, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h2 className="bd-title" style={{ fontSize: 28, marginBottom: 30 }}>欢迎回来</h2>
            <div style={{ margin: '20px 0' }}>
              <TextBox placeholder="手机号或邮箱" stylingMode="outlined" height={45} />
            </div>
            <div style={{ margin: '20px 0' }}>
              <TextBox mode="password" placeholder="密码" stylingMode="outlined" height={45} />
            </div>
            <Button text={loading ? '登录中...' : '登录'} type="default" width="100%" height={50} stylingMode="contained" onClick={handleLogin} disabled={loading} />
            <div style={{ marginTop: 16, fontSize: 13, color: '#7a625a', textAlign: 'center' }}>支持开发登录与微信登录</div>
          </div>
        </div>
      </div>
    </div>
  );
};

