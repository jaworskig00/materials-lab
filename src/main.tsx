import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/400.css';
import './style.css';
import { App } from './App';
import { boot } from './lib/store';
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
void boot();
