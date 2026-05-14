import { useContext } from 'react';
import { ConfigContext } from 'contexts/ConfigContext';
import type { ConfigState } from 'contexts/ConfigContext';

// ==============================|| CONFIG - HOOKS ||============================== //

export default function useConfig(): ConfigState {
  const context = useContext(ConfigContext);

  if (!context) throw new Error('useConfig must be used inside ConfigProvider');

  return context;
}
