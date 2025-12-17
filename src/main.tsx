import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import './index.css';
import router from './router';
import { RouterProvider } from 'react-router-dom';
import AppFooter from './components/AppFooter';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <RouterProvider router={router} />
      <AppFooter />
    </ChakraProvider>
  </React.StrictMode>,
);
