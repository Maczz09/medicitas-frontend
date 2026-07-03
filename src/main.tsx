import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Nunca reintentar 4xx (auth/validación/permisos) — no son fallas
      // transitorias y reintentarlas solo genera ruido. Con el stream SSE
      // disparando invalidateQueries() en cada evento del sistema, una sola
      // consulta con rol insuficiente podía terminar reintentándose en
      // cascada indefinidamente.
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: false,
      staleTime: 30_000,
      refetchInterval: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgb(var(--navy-850) / 0.96)',
              color: 'rgb(var(--ink-100))',
              border: '1px solid rgb(var(--hairline) / calc(var(--hairline-alpha) + 0.04))',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 16px 40px -18px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'rgb(var(--navy-850))' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: 'rgb(var(--navy-850))' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
