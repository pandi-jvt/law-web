import { useMemo } from 'react';

// material-ui
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// project imports
import useConfig from 'hooks/useConfig';
import CustomShadows from './custom-shadows';
import componentsOverride from './overrides';
import { buildPalette } from './palette';
import Typography from './typography';

// ==============================|| DEFAULT THEME - MAIN ||============================== //

interface ThemeCustomizationProps {
  children: React.ReactNode;
}

export default function ThemeCustomization({ children }: ThemeCustomizationProps): React.ReactElement {
  const { state } = useConfig();

  const themeTypography = useMemo(() => Typography(state.fontFamily), [state.fontFamily]);

  const palette = useMemo(() => buildPalette(state.presetColor), [state.presetColor]);

  const themeOptions = useMemo(
    () => ({
      breakpoints: {
        values: {
          xs: 0,
          sm: 768,
          md: 1024,
          lg: 1266,
          xl: 1440
        }
      },
      direction: 'ltr' as const,
      mixins: {
        toolbar: {
          minHeight: 60,
          paddingTop: 8,
          paddingBottom: 8
        }
      },
      typography: themeTypography,
      colorSchemes: {
        light: {
          palette: palette.light,
          customShadows: CustomShadows(palette.light)
        }
      },
      cssVariables: {
        cssVarPrefix: '',
        colorSchemeSelector: 'data-color-scheme'
      }
    }),
    [themeTypography, palette]
  );

  const themes = createTheme(themeOptions);
  (themes as { components?: unknown }).components = componentsOverride(themes);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider
        disableTransitionOnChange
        theme={themes}
        modeStorageKey="theme-mode"
        defaultMode="light"
      >
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
