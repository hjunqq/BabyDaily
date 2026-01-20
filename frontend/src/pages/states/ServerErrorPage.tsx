import { Button } from 'devextreme-react/button';

export const ServerErrorPage = () => {
  return (
    <div className="bd-state">
      <div className="bd-state-card">
        <div style={{ fontSize: 42 }}>500</div>
        <h3>服务器错误</h3>
        <p style={{ color: '#6b524b' }}>系统忙碌，请稍后再试。</p>
        <Button text="刷新" type="default" stylingMode="contained" height={40} />
      </div>
    </div>
  );
};
