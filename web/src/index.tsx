import ReactDOM from "react-dom/client";
import App from "./App";

// CSS reset
import "normalize.css";

// Fonts
import "@fontsource/ibm-plex-serif/400.css";
import "@fontsource/ibm-plex-serif/700.css";
import "@fontsource/ibm-plex-serif/400-italic.css";
import "@fontsource/ibm-plex-serif/700-italic.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/ibm-plex-sans/400-italic.css";
import "@fontsource/ibm-plex-sans/700-italic.css";

// Component styling
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/slide.css";
import "@szhsin/react-menu/dist/theme-dark.css";
// import "react-tooltip/dist/react-tooltip.css";

// Global styles
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
