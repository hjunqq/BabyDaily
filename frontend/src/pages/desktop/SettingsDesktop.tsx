import { Form, Item } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useEffect, useState } from 'react';
import { BabyService } from '../../services/api';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { FileUploader } from 'devextreme-react/file-uploader';
import type { UserSettings, RecordType } from '../../types';

export const SettingsDesktop = () => {
  const { baby } = useCurrentBaby();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [importStatus, setImportStatus] = useState<string | undefined>();

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
        exportFormat: settings.exportFormat,
        dayStartHour: settings.dayStartHour,
      });
      setSettings(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (e: any) => {
    const file = e.value[0];
    if (!file || !baby?.id) return;

    setImporting(true);
    setImportStatus('正在读取文件...');
    try {
      const content = await file.text();
      const lines = content.split('\n').map((l: string) => l.trim()).filter(Boolean);
      if (lines.length <= 1) throw new Error('文件内容为空或格式错误');

      // Simple CSV parser (ignoring quoted commas for now as it's a simple tool)
      const header = lines[0].toLowerCase().split(',');
      const records = lines.slice(1).map((line: string) => {
        const values = line.split(',');
        const row: any = {};
        header.forEach((key: string, i: number) => {
          row[key] = values[i];
        });

        // Map CSV fields to API fields
        const type = (row.type || 'FEED').toUpperCase() as RecordType;
        const time = row.date && row.time ? `${row.date}T${row.time}` : new Date().toISOString();

        let details: any = {};
        if (type === 'FEED') {
          details = { amount: Number(row.amount) || 0, subtype: row.subtype || 'BOTTLE', unit: row.unit || 'ml' };
        } else if (type === 'VITA_AD' || type === 'VITA_D3') {
          details = { amount: Number(row.amount) || 1, unit: row.unit || '粒' };
        }

        return {
          type,
          time,
          details,
          remark: row.remark || '',
        };
      });

      setImportStatus(`准备导入 ${records.length} 条数据...`);
      await BabyService.importRecords(baby.id, records);
      setImportStatus(`成功导入 ${records.length} 条记录！`);
    } catch (err: any) {
      setImportStatus(`导入失败: ${err.message}`);
    } finally {
      setImporting(false);
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
      <h2 className="bd-title">设置</h2>
      <div className="bd-card" style={{ maxWidth: 520 }}>
        <Form formData={settings} labelMode="floating" colCount={1}>
          <Item dataField="theme" label={{ text: '主题' }} />
          <Item dataField="language" label={{ text: '语言' }} />
          <Item dataField="exportFormat" label={{ text: '导出格式' }} />
          <Item
            dataField="dayStartHour"
            label={{ text: '日切时间 (一天从几点开始)' }}
            editorType="dxSelectBox"
            editorOptions={{
              items: [
                { value: 0, text: '00:00 (午夜)' },
                { value: 6, text: '06:00' },
                { value: 7, text: '07:00' },
                { value: 8, text: '08:00' },
              ],
              valueExpr: 'value',
              displayExpr: 'text',
              placeholder: '选择日切时间'
            }}
          />
        </Form>
        <Button text={saving ? '保存中...' : '保存设置'} type="default" stylingMode="contained" height={40} onClick={handleSave} disabled={saving} />
      </div>

      <div className="bd-card" style={{ maxWidth: 520, marginTop: 20 }}>
        <h3 className="bd-section-title">数据导入</h3>
        <p style={{ fontSize: 13, color: '#6b524b', marginBottom: 16 }}>
          支持 CSV 格式导入纪录。格式：date,time,type,amount,unit,subtype,remark<br />
          示例：2026-01-31,08:30:00,FEED,180,ml,BOTTLE,晨奶
        </p>
        <FileUploader
          selectButtonText="选择 CSV 文件"
          labelText=""
          accept=".csv"
          uploadMode="useForm"
          onValueChanged={handleImport}
          disabled={importing}
        />
        {importStatus && (
          <div style={{ marginTop: 12, fontSize: 13, color: importStatus.includes('失败') ? '#d9534f' : '#5cb85c' }}>
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
};
