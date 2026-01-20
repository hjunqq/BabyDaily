import { useIsMobile } from '../hooks/useIsMobile';
import { ApiTestDesktop } from './desktop/ApiTestDesktop';
import { ApiTestMobile } from './mobile/ApiTestMobile';

export const ApiTest = () => {
  const isMobile = useIsMobile();
  if (isMobile === null) return null;
  return isMobile ? <ApiTestMobile /> : <ApiTestDesktop />;
};
