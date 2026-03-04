import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import './index.css';

const theme = createTheme({
  defaultRadius: 0,
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Outfit, sans-serif' },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light" theme={theme}>
      <ModalsProvider>
        <Notifications position="top-right" zIndex={1000} />
        <App />
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>,
);
