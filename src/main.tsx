import React from 'react';
import ReactDOM from 'react-dom/client';
import { bind } from 'cuelume';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import './index.css';
import router from './router';
import { RouterProvider } from 'react-router-dom';
import AppFooter from './components/AppFooter';
import { initCanvasColor } from './utils/canvasColor';

initCanvasColor();
bind();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <RouterProvider router={router} />
      <AppFooter />
    </ChakraProvider>
  </React.StrictMode>,
);
