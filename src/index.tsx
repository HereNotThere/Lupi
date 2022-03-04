import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import { Web3Provider } from "./hooks/useWeb3Context";

ReactDOM.render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
