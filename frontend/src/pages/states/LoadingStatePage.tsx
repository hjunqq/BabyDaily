import { LoadIndicator } from 'devextreme-react/load-indicator';

export const LoadingStatePage = () => {
  return (
    <div className="bd-state">
      <div className="bd-state-card">
        <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
        <LoadIndicator visible />
      </div>
    </div>
  );
};
