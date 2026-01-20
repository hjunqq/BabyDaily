import { Form, Item } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { BabyService } from '../../services/api';
import type { UserSettings } from '../../types';

export const SettingsMobile = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await BabyService.getSettings();
        setSettings(data);
      } catch (err: any) {
        setError(err?.message || '获取设置失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await BabyService.updateSettings({
        theme: settings.theme,
        language: settings.language,
        export_format: settings.export_format,
      });
      setSettings(updated);
    } finally {
      setSaving(false);
    }
  };

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

  if (error || !settings) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{error || '未找到设置'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="bd-title" style={{ fontSize: 22 }}>设置</h2>
      <div className="bd-card">
        <Form formData={settings} labelMode="floating" colCount={1}>
          <Item dataField="theme" label={{ text: '主题' }} />
          <Item dataField="language" label={{ text: '语言' }} />
          <Item dataField="export_format" label={{ text: '导出格式' }} />
        </Form>
        <Button text={saving ? '保存中...' : '保存设置'} type="default" stylingMode="contained" width="100%" height={40} onClick={handleSave} disabled={saving} />
      </div>
    </div>
  );
};
