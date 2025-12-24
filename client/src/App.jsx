import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import queryClient from "./config/queryClient";
import AppRoutes from "./routes/AppRoutes.jsx";
import { ThemeProvider } from "./components/context/ThemeContext.jsx";
import { NotificationProvider } from "./components/context/NotificationContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/ui/ToastContainer.jsx";
import ErrorBoundary from "./components/error/ErrorBoundary.jsx";
import AuthCheck from "./components/auth/AuthCheck.jsx";
import RateLimitListener from "./components/notifications/RateLimitListener.jsx";
import SkipToContent from "./components/ui/SkipToContent.jsx";

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <Router>
                  <SkipToContent />
                  <AuthCheck>
                    <>
                      <RateLimitListener />
                      <AppRoutes />
                    </>
                  </AuthCheck>
                </Router>
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
        {/* React Query Devtools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
