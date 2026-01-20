import { useIsMobile } from '../hooks/useIsMobile';
import { OotdDesktop } from './desktop/OotdDesktop';
import { OotdMobile } from './mobile/OotdMobile';

export const Ootd = () => {
  const isMobile = useIsMobile();
  if (isMobile === null) return null;
  return isMobile ? <OotdMobile /> : <OotdDesktop />;
};
