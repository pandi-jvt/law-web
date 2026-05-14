import { createRoot } from 'react-dom/client';

// style.scss
import 'assets/style.css';

// scroll bar
import 'simplebar-react/dist/simplebar.min.css';

// apex-chart
import 'assets/third-party/apex-chart.css';
import 'assets/third-party/react-table.css';

import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

// project imports
import App from './App';
import { ConfigProvider } from 'contexts/ConfigContext';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
const root = createRoot(container);

// ==============================|| MAIN - REACT DOM RENDER ||============================== //

root.render(
  <ConfigProvider>
    <App />
  </ConfigProvider>
);

reportWebVitals();
