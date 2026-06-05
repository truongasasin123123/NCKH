import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import App from "./App";
import "./index.css";
import "antd/dist/reset.css";

createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#52c41a",
        borderRadius: 10,
        fontFamily: "Inter, system-ui, sans-serif",
      },
      components: {
        Layout: {
          headerBg: "#52c41a",
          siderBg: "#52c41a",
        },
        Menu: {
          itemColor: "#1a1919ff",
          itemHoverColor: "#1f201eff",
          itemSelectedColor: "#557f2aff",
          horizontalItemSelectedBg: "transparent",
        },
      },
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConfigProvider>
);
