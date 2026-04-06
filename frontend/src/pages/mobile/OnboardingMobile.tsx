import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { TextBox } from 'devextreme-react/text-box';
import { BabyService } from '../../services/api';

const genderOptions = [
  { value: 'FEMALE', label: '女孩' },
  { value: 'MALE', label: '男孩' },
];

export const OnboardingMobile = () => {
  const navigate = useNavigate();
  const [familyName, setFamilyName] = useState('');
  const [babyName, setBabyName] = useState('');
  const [birthday, setBirthday] = useState(new Date().toISOString().slice(0, 10));
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [loading, setLoading] = useState(false);
  const [existingFamilyName, setExistingFamilyName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const family = BabyService.getCurrentFamily();
    if (family?.name) {
      setExistingFamilyName(family.name);
      setFamilyName(family.name);
    }
  }, []);

  const handleSubmit = async () => {
    const trimmedFamilyName = familyName.trim();
    const trimmedBabyName = babyName.trim();

    if (!trimmedBabyName) {
      setError('请输入宝宝姓名');
      return;
    }

    if (!existingFamilyName && !trimmedFamilyName) {
      setError('请输入家庭名称');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let family = BabyService.getCurrentFamily();
      if (!family) {
        family = await BabyService.createFamily(trimmedFamilyName);
      }

      await BabyService.createBaby({
        family_id: family.id,
        name: trimmedBabyName,
        gender,
        birthday: new Date(birthday).toISOString(),
      });

      await BabyService.refreshSession();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '创建档案失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="bd-card" style={{ width: 'min(100%, 520px)', padding: 24 }}>
        <div style={{ fontSize: 40, textAlign: 'center' }}>🌸</div>
        <h2 className="bd-title" style={{ fontSize: 24, textAlign: 'center', marginBottom: 8 }}>完成首次设置</h2>
        <p className="bd-subtitle" style={{ textAlign: 'center', marginBottom: 24 }}>
          登录已完成。继续创建家庭和宝宝档案后，才会开放记录功能。
        </p>

        {!existingFamilyName ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontSize: 13, color: '#6b524b' }}>家庭名称</div>
            <TextBox
              value={familyName}
              onValueChanged={(e) => setFamilyName(String(e.value || ''))}
              placeholder="例如：小荔枝的家"
              stylingMode="outlined"
              height={44}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: '#fff8f5', color: '#6b524b' }}>
            当前家庭：{existingFamilyName}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#6b524b' }}>宝宝姓名</div>
          <TextBox
            value={babyName}
            onValueChanged={(e) => setBabyName(String(e.value || ''))}
            placeholder="请输入宝宝姓名"
            stylingMode="outlined"
            height={44}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#6b524b' }}>性别</div>
          <SelectBox
            items={genderOptions}
            valueExpr="value"
            displayExpr="label"
            value={gender}
            onValueChanged={(e) => setGender(e.value)}
            stylingMode="outlined"
            height={44}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#6b524b' }}>生日</div>
          <input
            type="date"
            value={birthday}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthday(e.target.value)}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 8,
              border: '1px solid #d1d5db',
              padding: '0 12px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error ? (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: '#fff1f2', color: '#b91c1c', fontSize: 13 }}>
            {error}
          </div>
        ) : null}

        <Button
          text={loading ? '保存中...' : '完成设置'}
          type="default"
          stylingMode="contained"
          width="100%"
          height={46}
          onClick={handleSubmit}
          disabled={loading}
        />
      </div>
    </div>
  );
};
