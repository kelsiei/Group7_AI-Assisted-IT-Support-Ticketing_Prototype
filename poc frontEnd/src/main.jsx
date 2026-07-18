import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import HelpDeskAIPoC from "./HelpDeskAIPoC.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelpDeskAIPoC />
  </React.StrictMode>
);
