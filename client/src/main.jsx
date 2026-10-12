import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './features/store.js';
import App from './App.jsx';

// Styling foundation: tokens, reset, and global styles
import './styles/tokens.css';
import './styles/reset.css';
import './styles/global.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
}
