import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

function logClientError(message: string, stack?: string) {
  supabase.from('error_logs').insert({
    error_message: message,
    error_stack: stack,
    url: window.location.href,
    user_agent: navigator.userAgent,
  }).then(() => {}).catch(() => {});
}

window.addEventListener('error', (event) => {
  logClientError(event.message, event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  logClientError(event.reason?.message ?? String(event.reason), event.reason?.stack);
});

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
