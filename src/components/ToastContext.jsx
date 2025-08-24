import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const showToast = (msg, duration = 3000) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.8)",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "5px",
          zIndex: 1000
        }}>
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
