import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import './index.css';
import router from './router';
import { RouterProvider } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <RouterProvider router={router} />
      <div className="desktop-footer">
        Extension Systems Project 02 [EX_P02] Version 0.0.1 | Produced by
        Extension Systems LLC 2025©
      </div>
    </ChakraProvider>
  </React.StrictMode>,
);
