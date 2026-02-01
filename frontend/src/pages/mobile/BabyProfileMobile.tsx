import { LoadIndicator } from 'devextreme-react/load-indicator';
import { DateBox } from 'devextreme-react/date-box';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import { useState, useEffect, useRef } from 'react';
import { useCurrentBaby } from '../../hooks/useCurrentBaby';
import { BabyService } from '../../services/api';
import { API_URL } from '../../config/env';

export const BabyProfileMobile = () => {
  const { baby, loading, error, refresh } = useCurrentBaby();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (baby) {
      setName(baby.name);
      setGender(baby.gender);
      setBirthday(new Date(baby.birthday));
    }
  }, [baby]);

  const handleSave = async () => {
    if (!baby || !birthday || !name) return;
    setIsSaving(true);
    try {
      await BabyService.updateBaby(baby.id, {
        name,
        gender,
        birthday: birthday.toISOString()
      });
      await refresh();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !baby) return;

    try {
      await BabyService.uploadAvatar(baby.id, file);
      await refresh();
    } catch (err) {
      console.error(err);
      alert('上传失败');
    }
    // Clear input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  if (error || !baby) {
    return (
      <div className="bd-state">
        <div className="bd-state-card">
          <div style={{ fontSize: 42 }}>⚠️</div>
          <h3>加载失败</h3>
          <p style={{ color: '#6b524b' }}>{error || '未找到宝宝信息'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="bd-title" style={{ fontSize: 22, margin: 0 }}>宝宝档案</h2>
        <Button
          text={isEditing ? (isSaving ? '保存中...' : '保存') : '编辑'}
          type={isEditing ? 'default' : 'normal'}
          stylingMode={isEditing ? 'contained' : 'text'}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={isSaving}
        />
      </div>

      <div className="bd-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: '#F7EFEB',
            overflow: 'hidden',
            position: 'relative',
            cursor: isEditing ? 'pointer' : 'default'
          }}
          onClick={handleAvatarClick}
        >
          {baby.avatarUrl ? (
            <img src={baby.avatarUrl.startsWith('http') ? baby.avatarUrl : `${API_URL}${baby.avatarUrl}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
          {isEditing && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
              更换
            </div>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileChange}
        />
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <div style={{ marginBottom: 12 }}>
              <TextBox
                value={name}
                onValueChanged={(e) => setName(e.value)}
                placeholder="宝宝昵称"
                stylingMode="outlined"
              />
            </div>
          ) : (
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{baby.name}</div>
          )}

          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#8b7670', marginRight: 8, fontSize: 13, minWidth: 28 }}>生日</span>
            {isEditing ? (
              <DateBox
                value={birthday}
                onValueChanged={(e) => setBirthday(e.value)}
                type="date"
                displayFormat="yyyy-MM-dd"
                width="100%"
              />
            ) : (
              <span>{new Date(baby.birthday).toLocaleDateString('zh-CN')}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#8b7670', marginRight: 8, fontSize: 13, minWidth: 28 }}>性别</span>
            {isEditing ? (
              <SelectBox
                items={[{ id: 'MALE', text: '男' }, { id: 'FEMALE', text: '女' }]}
                valueExpr="id"
                displayExpr="text"
                value={gender}
                onValueChanged={(e) => setGender(e.value)}
                width={100}
              />
            ) : (
              <span>{baby.gender === 'FEMALE' ? '女' : '男'}</span>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Button text="取消" onClick={() => setIsEditing(false)} stylingMode="text" />
          </div>

          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #fee2e2' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 12, textTransform: 'uppercase' }}>危险区域</div>
            <Button
              text="清空所有记录 (测试数据)"
              type="danger"
              stylingMode="outlined"
              width="100%"
              onClick={async () => {
                // Use native confirm for mobile
                if (window.confirm('确定要清空该宝宝的所有记录吗？\n此操作不可恢复！')) {
                  try {
                    await BabyService.deleteAllRecords(baby.id);
                    alert('记录已全部清空');
                    await refresh(); // Refresh stats
                  } catch (err) {
                    console.error(err);
                    alert('清空失败');
                  }
                }
              }}
            />
            <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 8, textAlign: 'center' }}>
              将删除该宝宝名下的所有喂养、睡眠、尿布记录。
            </p>
          </div>
        </>
      )}
    </div>
  );
};

