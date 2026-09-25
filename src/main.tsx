import React from 'react';
import ReactDOM from 'react-dom/client';
// Only the weights actually used are pulled in (latin subset) — keeps font
// payloads minimal instead of shipping every weight/script on first load.
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource/fira-code/latin-400.css';
import '@fontsource/fira-code/latin-500.css';
import '@fontsource/fira-code/latin-600.css';
import '@fontsource/fira-code/latin-700.css';
import App from './App';
import './index.css';

const container = document.getElementById('root')!;
const splash = document.getElementById('boot-splash');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Remove the pre-paint splash once React has committed its first frame.
requestAnimationFrame(() => {
  if (splash && splash.parentNode) {
    splash.classList.add('boot-done');
    splash.parentNode.removeChild(splash);
  }
});