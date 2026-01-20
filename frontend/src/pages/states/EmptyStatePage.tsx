import { Button } from 'devextreme-react/button';

export const EmptyStatePage = () => {
  return (
    <div className="bd-state">
      <div className="bd-state-card">
        <div style={{ fontSize: 42 }}>🍼</div>
        <h3>暂无记录</h3>
        <p style={{ color: '#6b524b' }}>今天还没有记录，开始添加第一条吧。</p>
        <Button text="添加记录" type="default" stylingMode="contained" height={40} />
      </div>
    </div>
  );
};
