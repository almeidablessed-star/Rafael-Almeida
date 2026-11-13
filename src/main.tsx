import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import './index.css';
import { ligaMonitoramento } from './lib/monitoramento';
import { ligaTopoIos27 } from './utils/topoIos27';
import { ligaTelaDeToque } from './utils/telaDeToque';

ligaMonitoramento();
ligaTopoIos27();
ligaTelaDeToque();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
