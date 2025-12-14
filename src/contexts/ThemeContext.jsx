import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isAltTheme, setIsAltTheme] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("isAltTheme");
    if (stored === "1") {
      setIsAltTheme(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("isAltTheme", isAltTheme ? "1" : "0");
  }, [isAltTheme]);

  return (
    <ThemeContext.Provider value={{ isAltTheme, setIsAltTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
