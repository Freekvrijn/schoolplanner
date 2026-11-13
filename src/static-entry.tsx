// Entry for the static GitHub Pages build (vite.pages.config.ts). No server framework involved.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";
import { PlannerApp } from "./planner/PlannerApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlannerApp />
  </StrictMode>,
);

