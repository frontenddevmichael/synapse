import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (window.confirm('A new version of Synapse is available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(() => {
        // Service worker registration failed — app still works without offline support
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
