import { Button } from 'devextreme-react/button';

export const NotFoundPage = () => {
  return (
    <div className="bd-state">
      <div className="bd-state-card">
        <div style={{ fontSize: 42 }}>404</div>
        <h3>页面不存在</h3>
        <p style={{ color: '#6b524b' }}>请返回首页继续浏览。</p>
        <Button text="返回首页" type="default" stylingMode="contained" height={40} />
      </div>
    </div>
  );
};
