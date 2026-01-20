import { Button } from 'devextreme-react/button';

export const OnboardingMobile = () => {
  return (
    <div>
      <div className="bd-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🌸</div>
        <h2 className="bd-title" style={{ fontSize: 22 }}>欢迎来到 BabyDaily</h2>
        <p className="bd-subtitle">记录宝宝的日常与成长，只需三步。</p>
        <Button text="开始创建宝宝档案" type="default" stylingMode="contained" width="100%" height={44} />
      </div>
    </div>
  );
};
