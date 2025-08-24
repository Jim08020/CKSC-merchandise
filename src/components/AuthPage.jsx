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
  const [confirmPassword, setConfirmPassword] = useState(""); // 新增確認密碼
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
        // 註冊
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 存額外資訊到 Firestore
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
        // 登入
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
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>{isSignUp ? "註冊" : "登入"}</h2>
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <input
              type="text"
              placeholder="姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ display: "block", margin: "10px auto", padding: "8px" }}
            />
            <input
              type="text"
              placeholder="電話"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{ display: "block", margin: "10px auto", padding: "8px" }}
            />
          </>
        )}
        <input
          type="email"
          placeholder="電子郵件"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: "block", margin: "10px auto", padding: "8px" }}
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", margin: "10px auto", padding: "8px" }}
        />
        {isSignUp && (
          <input
            type="password"
            placeholder="確認密碼"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ display: "block", margin: "10px auto", padding: "8px" }}
          />
        )}
        <button type="submit" style={{ margin: "10px auto", padding: "10px 20px" }}>
          {isSignUp ? "註冊" : "登入"}
        </button>
      </form>

      <p>
        {isSignUp ? "已經有帳號？" : "還沒有帳號？"}{" "}
        <button onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "去登入" : "去註冊"}
        </button>
      </p>
    </div>
  );
}
