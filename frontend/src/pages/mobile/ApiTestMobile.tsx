import { Button } from 'devextreme-react/button';
import { TextArea } from 'devextreme-react/text-area';

export const ApiTestMobile = () => {
  return (
    <div>
      <h2 className="bd-title" style={{ fontSize: 22 }}>接口测试</h2>
      <div className="bd-card" style={{ marginBottom: 12 }}>
        <Button text="运行测试" type="default" stylingMode="contained" width="100%" height={40} />
      </div>
      <div className="bd-card">
        <TextArea value="[10:20] 请求 /records ... 200 成功" height={120} readOnly />
      </div>
    </div>
  );
};
