import { createGlobalStyle } from "styled-components";
import reset from "styled-reset";

import "antd/dist/antd.css";

import "../public/assets/css/font.css";

const GlobalStyle = createGlobalStyle`
  ${reset}

  * {
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    height: 100%;

    font-family: 'Roboto-regular', "Noto Sans KR", sans-serif;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
    color: #111111;

    margin: 0;
    padding: 0;
  } 

  /* Scroll */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(204, 204, 204, 0.4);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    opacity: 0.7;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`;

export default GlobalStyle;
