import { Button } from 'devextreme-react/button';
import { List } from 'devextreme-react/list';
import { FileUploader } from 'devextreme-react/file-uploader';
import { TextBox } from 'devextreme-react/text-box';
import { DateBox } from 'devextreme-react/date-box';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { useState } from 'react';
import { useOotdData } from '../../hooks/useOotdData';
import { OotdService } from '../../services/ootd';

export const OotdDesktop = () => {
  const { loading, error, items, babyId, handleLike, handleDelete, refresh } = useOotdData();
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!babyId || files.length === 0) return;
    setUploading(true);
    try {
      const list = new DataTransfer();
      files.forEach(file => list.items.add(file));
      await OotdService.uploadOotd({
        babyId: babyId,
        files: list.files,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        date: date.toISOString().slice(0, 10),
      });
      setFiles([]);
      setTags('');
      refresh();
    } finally {
      setUploading(false);
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
      <h2 className="bd-title">宝宝穿搭相册</h2>
      <div className="bd-grid two" style={{ marginTop: 16 }}>
        <div className="bd-card">
          <div className="bd-section-title">上传穿搭</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <FileUploader
              multiple
              accept="image/*"
              uploadMode="useForm"
              showFileList
              onValueChanged={e => setFiles(e.value || [])}
            />
            <TextBox placeholder="标签（逗号分隔）" value={tags} onValueChanged={e => setTags(e.value)} />
            <DateBox type="date" value={date} onValueChanged={e => setDate(e.value)} />
            <Button text={uploading ? '上传中...' : '上传穿搭'} type="default" stylingMode="contained" height={40} onClick={handleUpload} disabled={uploading || files.length === 0} />
          </div>
        </div>
        <div className="bd-card">
          <div className="bd-section-title">最近穿搭</div>
          <List
            dataSource={items}
            noDataText="暂无穿搭记录"
            itemRender={item => (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #E8DCD6' }}>
                <img src={item.thumbnailUrl || item.imageUrl} alt="穿搭照片" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', background: '#F7EFEB' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.tags?.join(' / ') || '今日穿搭'}</div>
                  <div style={{ fontSize: 12, color: '#6b524b' }}>{item.date}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <Button text={`点赞 ${item.likes || 0}`} stylingMode="text" onClick={() => handleLike(item.id)} />
                    <Button text="删除" stylingMode="text" onClick={() => handleDelete(item.id)} />
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};
