import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import { ThemeProvider } from "./components/context/ThemeContext.jsx";
import { NotificationProvider } from "./components/context/NotificationContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/ui/ToastContainer.jsx";
import ErrorBoundary from "./components/error/ErrorBoundary.jsx";
import AuthCheck from "./components/auth/AuthCheck.jsx";

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <ToastProvider>
              <Router>
                <AuthCheck>
                  <AppRoutes />
                </AuthCheck>
              </Router>
            </ToastProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
