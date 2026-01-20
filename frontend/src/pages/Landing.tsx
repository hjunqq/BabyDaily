import { Button } from 'devextreme-react/button';
import { Link } from 'react-router-dom';

export const Landing = () => {
  return (
    <div className="bd-app" style={{ minHeight: '100vh' }}>
      <div className="bd-main bd-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="bd-logo">BabyDaily</div>
          <div style={{ display: 'flex', gap: 20, fontSize: 14, alignItems: 'center' }}>
            <span>功能</span>
            <span>设计</span>
            <span>价格</span>
            <Link to="/login">登录</Link>
          </div>
        </div>

        <section className="bd-hero">
          <div>
            <h1 className="bd-title" style={{ fontSize: 40 }}>轻奢质感的育儿日常记录</h1>
            <p className="bd-subtitle" style={{ fontSize: 16, lineHeight: 1.7 }}>
              温柔克制的界面，为你留出心力陪伴。快速记录喂奶、尿布、睡眠与穿搭，所有数据一目了然。
            </p>
            <div className="bd-cta">
              <Button text="开始体验" stylingMode="contained" type="default" width={140} height={44} />
              <Button text="查看样例" stylingMode="outlined" type="default" width={140} height={44} />
            </div>
          </div>
          <div className="bd-hero-panel">
            <div className="bd-card" style={{ marginBottom: 12 }}>
              <div className="bd-section-title">今日总览</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>奶量</span><strong>480 ml</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>尿布</span><strong>湿3 / 脏2</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>睡眠</span><strong>8h 30m</strong></div>
            </div>
            <div className="bd-card">
              <div className="bd-section-title">最近记录</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>10:30</span><span>喂奶 120 ml</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>09:15</span><span>尿布 湿</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>08:20</span><span>睡眠 1h 10m</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <span className="bd-pill">低刺激设计</span>
              <span className="bd-pill">高对比度</span>
              <span className="bd-pill">轻奢质感</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
