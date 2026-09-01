import { useState, useEffect } from 'react';

/**
 * 检测当前客户端是否为移动端手机或小屏设备 (width < 768px 或移动端 UA)
 */
export const useIsMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isNarrow = window.innerWidth < breakpoint;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    return isNarrow || isMobileUA;
  });

  useEffect(() => {
    const handleResize = () => {
      const isNarrow = window.innerWidth < breakpoint;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(isNarrow || isMobileUA);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};
