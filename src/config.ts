// ==============================|| THEME CONSTANT ||============================== //

export const APP_DEFAULT_PATH = '/dashboard/default';
export const DRAWER_WIDTH = 260;
export const MINI_DRAWER_WIDTH = 60;

export interface AppConfig {
  fontFamily: string;
  presetColor?: string;
}

const config: AppConfig = {
  fontFamily: `'Public Sans', sans-serif`
};

export default config;
