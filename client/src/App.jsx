import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { ThemeProvider, useTheme } from "./components/context/ThemeContext.jsx";

const ThemedApp = () => {
  const { theme } = useTheme();

  return (
    <div
      className={`relative min-h-screen
    ${
      theme === "light"
        ? "bg-gradient-to-b from-[#FCF9F5] to-[#F2E8D5]"
        : "bg-[#1A1A1A]"
    }
  `}
    >
      {/* Gradient overlay only in dark mode */}
      {theme === "dark" && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(198,173,143,0.3)] to-transparent z-0" />
      )}

      {/* Actual content */}
      <div className="relative z-10">
        <Navbar />
        <main className="pt-20 px-2">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <ThemedApp />
      </Router>
    </ThemeProvider>
  );
};

export default App;
