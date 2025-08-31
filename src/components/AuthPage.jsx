import React, { useState } from "react";
import { auth, db } from "../firebase";
import { 
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "./ToastContext";

export default function AuthPage() {
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 檢查使用者是否已完成資料填寫
  const checkUserProfileCompleted = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return false; // 新用戶，未填寫資料
      }
      
      const userData = userSnap.data();
      return userData.profileCompleted === true;
    } catch (error) {
      console.error("Error checking user profile:", error);
      return false;
    }
  };

  // 檢查使用者是否為新用戶
  const checkIfNewUser = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      return !userSnap.exists();
    } catch (error) {
      console.error("Error checking user:", error);
      return false;
    }
  };

  // Google 登入/註冊處理
  const handleGoogleAuth = async () => {
    if (!agree) {
      showToast("請先閱讀並同意使用者條款");
      return;
    }

    const provider = new GoogleAuthProvider();
    // 設定 popup 參數
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 檢查是否為新用戶或未完成資料填寫
      const isNew = await checkIfNewUser(user);
      const profileCompleted = await checkUserProfileCompleted(user);
      
      if (isNew || !profileCompleted) {
        // 新用戶或未完成資料填寫，跳轉到資料填寫頁面
        showToast("Google 認證成功！請完成註冊資料");
        navigate("/info");
      } else {
        // 既有用戶且已完成資料填寫，直接登入
        showToast("登入成功！");
        navigate("/");
      }
    } catch (error) {
      console.error("Google Auth error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        showToast("Google 登入被取消");
      } else if (error.code === 'auth/popup-blocked') {
        showToast("彈出視窗被阻擋，請允許彈出視窗後重試");
      } else {
        showToast("Google 認證失敗：" + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "20px",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "32px 24px",
          maxWidth: "380px",
          width: "100%",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
        className="auth-card"
      >
        <h1 style={{ marginBottom: "16px", color: "#333", fontSize: "1.5rem" }}>
          註冊/登入
        </h1>
        
        <h2 style={{ marginBottom: "24px", color: "#666", fontSize: "1rem", fontWeight: "normal" }}>
          使用 Google 帳號登入或註冊
        </h2>
        
        {/* Google 登入按鈕 */}
        <button 
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          style={{
            ...googleBtnStyle,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          <svg
            style={{ width: "20px", height: "20px", marginRight: "12px" }}
            viewBox="0 0 48 48"
          >
            <path
              d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
              fill="#4285F4"
            />
            <path
              d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
              fill="#34A853"
            />
            <path
              d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
              fill="#FBBC05"
            />
            <path
              d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
              fill="#EA4335"
            />
          </svg>
          {isLoading ? "Loading" : "Sign up or Log in wirh Google"}
        </button>

        {/* 同意使用者條款 */}
        <label style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "center", display: "block" }}>
          <input 
            type="checkbox" 
            checked={agree} 
            onChange={() => setAgree(!agree)} 
            style={{ marginRight: "8px" }}
          />
          我已閱讀並同意 <Link to="/rule" style={{ color: "#667eea", fontWeight: "bold" }}>使用者條款</Link>
        </label>
      </div>
    </div>
  );
}

// 樣式定義
const googleBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 20px",
  borderRadius: "8px",
  border: "1px solid #dadce0",
  background: "white",
  color: "#3c4043",
  fontSize: "1rem",
  fontWeight: "500",
  cursor: "pointer",
  width: "100%",
  transition: "all 0.2s",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};