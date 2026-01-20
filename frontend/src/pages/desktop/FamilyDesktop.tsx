import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { BabyService } from '../../services/api';
import type { Family } from '../../types';

export const FamilyDesktop = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await BabyService.ensureDevEnvironment();
        const data = await BabyService.getFamilies();
        setFamilies(data);
      } catch (err: any) {
        setError(err?.message || '获取家庭失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 18, marginBottom: 8 }}>加载中...</div>
          <LoadIndicator visible />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="bd-title">家庭列表</h2>
      <div className="bd-card">
        <DataGrid dataSource={families} showBorders={false} columnAutoWidth>
          <Column dataField="name" caption="家庭名称" />
          <Column dataField="id" caption="ID" />
        </DataGrid>
        <div style={{ marginTop: 12 }}>
          <Button text="邀请成员" type="default" stylingMode="contained" height={40} />
        </div>
      </div>
    </div>
  );
};
