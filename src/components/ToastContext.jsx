import React, { createContext, useContext, useState, useRef } from "react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(1);
  const timeoutRef = useRef(null);
  const lastMessageRef = useRef("");

  const showToast = (msg, duration = 3000) => {
    // 清除之前的 timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 檢查是否為相同訊息
    if (lastMessageRef.current === msg && visible) {
      // 相同訊息，增加次數
      setCount(prevCount => prevCount + 1);
    } else {
      // 新訊息，重置次數
      setMessage(msg);
      setCount(1);
      lastMessageRef.current = msg;
      setVisible(true);
    }

    // 設置新的 timeout
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setCount(1);
      lastMessageRef.current = "";
    }, duration);
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
          borderRadius: "10px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>{message}</span>
          {count > 1 && (
            <span style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "20px",
              padding: "2px 6px",
              fontSize: "0.8em",
              minWidth: "20px",
              textAlign: "center"
            }}>
              {count}
            </span>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}