import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import { logger } from "./utils/logger";
import { Web3Provider } from "./hooks/useWeb3";

logger.info(`Loading index.tsx`);

ReactDOM.render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
