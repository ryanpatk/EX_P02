import React from 'react';
import ReactDOM from 'react-dom/client';
import { bind } from 'cuelume';
import '@fontsource-variable/inter';
import '@fontsource-variable/geist-mono';
import './index.css';
import router from './router';
import { RouterProvider } from 'react-router-dom';
import AppFooter from './components/AppFooter';
import { initCanvasColor } from './utils/canvasColor';
import { initSound } from './utils/sound';

initCanvasColor();
initSound();
bind();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <AppFooter />
  </React.StrictMode>,
);
