import { Button } from 'devextreme-react/button';
import { TextArea } from 'devextreme-react/text-area';

export const ApiTestDesktop = () => {
  return (
    <div>
      <h2 className="bd-title">接口测试控制台</h2>
      <div className="bd-card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>快速测试</div>
        <Button text="运行测试" type="default" stylingMode="contained" height={40} />
      </div>
      <div className="bd-card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>输出日志</div>
        <TextArea value="[10:20] 请求 /records ... 200 成功" height={120} readOnly />
      </div>
    </div>
  );
};
