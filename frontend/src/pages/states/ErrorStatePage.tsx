import { Button } from 'devextreme-react/button';

export const ErrorStatePage = () => {
  return (
    <div className="bd-state">
      <div className="bd-state-card">
        <div style={{ fontSize: 42 }}>⚠️</div>
        <h3>加载失败</h3>
        <p style={{ color: '#6b524b' }}>网络异常，请稍后重试。</p>
        <Button text="重试" type="default" stylingMode="contained" height={40} />
      </div>
    </div>
  );
};
