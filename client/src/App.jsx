import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { ThemeProvider, useTheme } from "./components/context/ThemeContext.jsx";

const ThemedApp = () => {
  const { theme } = useTheme();

  return (
    <div
      className={`relative min-h-screen ${
        theme === "light" ? "bg-[#f7ede1]" : "bg-[#1A1A1A]"
      }`}
    >
      <Navbar />

      {/* Page Routes */}
      <main className="pt-20 ">
        <AppRoutes />
      </main>
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
