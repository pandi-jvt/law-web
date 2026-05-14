import { useEffect } from 'react';

// ==============================|| NAVIGATION - SCROLL TO TOP ||============================== //

interface ScrollTopProps {
  children?: React.ReactNode;
}

export default function ScrollTop({ children }: ScrollTopProps): React.ReactElement {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, []);

  return <>{children ?? null}</>;
}
