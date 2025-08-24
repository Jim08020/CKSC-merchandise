import React, { useState } from "react";
import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ToastContext";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState(""); 
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp && password !== confirmPassword) {
      showToast("❌ 密碼與確認密碼不一致！");
      return;
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          name,
          phone,
          email,
          password, 
          createdAt: new Date()
        });

        showToast("✅ 註冊成功！");
        navigate("/"); 
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("✅ 登入成功！");
        navigate("/"); 
      }
    } catch (error) {
      console.error("Auth error:", error.message);
      showToast("❌ " + error.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "40px 30px",
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        textAlign: "center"
      }}>
        <h2 style={{ marginBottom: "24px", color: "#333" }}>
          {isSignUp ? "註冊" : "登入"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="電話"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={inputStyle}
              />
            </>
          )}

          <input
            type="email"
            placeholder="電子郵件"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {isSignUp && (
            <input
              type="password"
              placeholder="確認密碼"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
            />
          )}

          <button type="submit" style={submitBtnStyle}>
            {isSignUp ? "註冊" : "登入"}
          </button>
        </form>

        <p style={{ marginTop: "20px", color: "#555" }}>
          {isSignUp ? "已經有帳號？" : "還沒有帳號？"}{" "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isSignUp ? "去登入" : "去註冊"}
          </button>
        </p>
      </div>
    </div>
  );
}

// 可重複使用的 input style
const inputStyle = {
  padding: "10px 14px",
  margin: "8px 0",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  outline: "none",
  transition: "border 0.2s",
};

const submitBtnStyle = {
  padding: "12px 20px",
  marginTop: "16px",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
  color: "white",
  fontWeight: "bold",
  fontSize: "1rem",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(221,36,118,0.25)",
  transition: "all 0.2s ease-in-out",
};
