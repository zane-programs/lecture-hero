import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Summary from "./pages/Summary";
import { createContext, useContext, useEffect, useState } from "react";

const router = createBrowserRouter([
  { path: "/summary/:id", element: <Summary /> },
]);

function getInitialDarkModeValue() {
  // true  = dark
  // false = light
  const colorMode = localStorage.getItem("lecturehero-color-mode");
  return colorMode
    ? colorMode === "dark"
    : window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(getInitialDarkModeValue());

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("lecturehero-color-mode", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("lecturehero-color-mode", "light");
    }
  }, [darkMode]);

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode }}>
      <RouterProvider router={router} />
    </AppContext.Provider>
  );
}

interface IAppContext {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}
const AppContext = createContext<IAppContext>({} as IAppContext);
export function useApp() {
  return useContext(AppContext);
}
