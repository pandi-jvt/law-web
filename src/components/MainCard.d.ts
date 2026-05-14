import type { ReactNode } from 'react';

export interface MainCardProps {
  title?: ReactNode;
  children?: ReactNode;
  border?: boolean;
  boxShadow?: boolean;
  subheader?: ReactNode;
  content?: boolean;
  contentSX?: object;
  darkTitle?: boolean;
  divider?: boolean;
  elevation?: number;
  secondary?: ReactNode;
  shadow?: string;
  sx?: object;
  codeHighlight?: boolean;
  codeString?: string;
  modal?: boolean;
  ref?: React.Ref<unknown>;
}

declare const MainCard: React.FC<MainCardProps>;
export default MainCard;
