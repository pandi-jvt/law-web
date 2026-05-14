import React, { createContext, useMemo } from 'react';
import config, { type AppConfig } from 'config';
import { useLocalStorage } from 'hooks/useLocalStorage';

// ==============================|| CONFIG CONTEXT ||============================== //

export interface ConfigState {
  state: AppConfig;
  setState: React.Dispatch<React.SetStateAction<AppConfig>>;
  setField: (key: keyof AppConfig, value: AppConfig[keyof AppConfig]) => void;
  resetState: () => void;
}

export const ConfigContext = createContext<ConfigState | undefined>(undefined);

// ==============================|| CONFIG PROVIDER ||============================== //

interface ConfigProviderProps {
  children: React.ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps): React.ReactElement {
  const { state, setState, setField, resetState } = useLocalStorage<AppConfig>(
    'mantis-react-free-config',
    config
  );

  const memoizedValue = useMemo(
    () => ({ state, setState, setField, resetState }),
    [state, setField, setState, resetState]
  );

  return <ConfigContext.Provider value={memoizedValue}>{children}</ConfigContext.Provider>;
}
