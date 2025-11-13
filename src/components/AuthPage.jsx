import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "./ToastContext";

export default function AuthPage() {
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInLineApp, setIsInLineApp] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 檢測是否在 LINE 內建瀏覽器
  const isLineApp = () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('line/') || ua.includes('liff/');
  };

  // 初始化或更新使用者資料
  const initializeUserData = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // 新用戶：建立完整資料，預設為一般用戶
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          role: "user", // 預設為一般用戶
          status: "active",
          profileCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        return true; // 是新用戶
      } else {
        // 現有用戶：確保有 role 欄位（如果沒有則設為 user）
        const userData = userSnap.data();
        
        if (!userData.role) {
          await setDoc(userRef, {
            role: "user",
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        
        return false; // 不是新用戶
      }
    } catch (error) {
      console.error("Error initializing user data:", error);
      throw error;
    }
  };

  // 檢查使用者是否已完成資料填寫
  const checkUserProfileCompleted = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return false;
      }
      
      const userData = userSnap.data();
      return userData.profileCompleted === true;
    } catch (error) {
      console.error("Error checking user profile:", error);
      return false;
    }
  };

  // 處理登入成功後的導向
  const handleAuthSuccess = async (user) => {
    try {
      // 初始化使用者資料並獲取是否為新用戶
      const isNewUser = await initializeUserData(user);
      const profileCompleted = await checkUserProfileCompleted(user);
      
      if (!profileCompleted) {
          showToast("請完成個人資料填寫");
          navigate("/info");
        } else {
          showToast("登入成功！");
          navigate("/");
        }

      if (isNewUser || !profileCompleted) {
        showToast("Google 認證成功！請完成註冊資料");
        navigate("/info");
      } else {
        showToast("登入成功！");
        navigate("/");
      }
    } catch (error) {
      console.error("Error handling auth success:", error);
      showToast("資料初始化失敗，請重試");
    }
  };

  // 組件載入時檢測環境並處理 redirect 結果
  useEffect(() => {
    setIsInLineApp(isLineApp());

    // 處理 redirect 登入結果
    const handleRedirectResult = async () => {
      try {
        setIsLoading(true);
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          await handleAuthSuccess(result.user);
        }
      } catch (error) {
        console.error("Redirect result error:", error);
        
        if (error.code === 'auth/account-exists-with-different-credential') {
          showToast("此帳號已使用其他方式註冊");
        } else if (error.code === 'auth/popup-closed-by-user') {
          showToast("登入已取消");
        } else {
          showToast("Google 認證失敗，請重試");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    handleRedirectResult();
  }, []);

  // Google 登入/註冊處理
  const handleGoogleAuth = async () => {
    if (!agree) {
      showToast("請先閱讀並同意使用者條款");
      return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      setIsLoading(true);
      
      // 根據環境選擇登入方式
      if (isInLineApp) {
        // LINE 內使用 redirect（避免彈出視窗被阻擋）
        await signInWithRedirect(auth, provider);
        // redirect 會導向到 Google 登入頁面，完成後回到這裡由 useEffect 處理
      } else {
        // 其他瀏覽器使用 popup（體驗較好）
        const result = await signInWithPopup(auth, provider);
        await handleAuthSuccess(result.user);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Google Auth error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        showToast("Google 登入被取消");
      } else if (error.code === 'auth/popup-blocked') {
        showToast("彈出視窗被阻擋，請允許彈出視窗後重試");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        showToast("此帳號已使用其他方式註冊");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // 使用者快速點擊多次，忽略此錯誤
        console.log("Popup request cancelled");
      } else {
        showToast("Google 認證失敗，請重試");
      }
      
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

        {/* LINE 用戶提示 */}
        {isInLineApp && (
          <div style={{
            marginBottom: "16px",
            padding: "12px",
            background: "#ffe7e7",
            border: "1px solid #ff0000",
            borderRadius: "8px",
            fontSize: "0.85rem",
            color: "#a10d0d",
            textAlign: "left",
            alignItems: "center",
            display: "flex",
            flexDirection: "column"
          }}>
            <strong>⚠️ LINE 用戶提示</strong>
            <p style={{ margin: "8px 0 0 0", lineHeight: "1.5" }}>
              Line 用戶請使用外部瀏覽器(例：Safari, Google...)，否則無法登入成功
            </p>
            <button 
            onClick={() => {
              window.open('souvenir.cksc.tw', '_blank');
            }}
            style={{
              display: "flex",
              marginTop: "8px",
              padding: "8px 12px",
              background: "#dd2476",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            開啟外部瀏覽器
          </button>
          </div>
        )}
        <div style={{
          marginBottom: "16px",
          padding: "12px",
          background: "#ffe7e7",
          border: "1px solid #ff0000",
          borderRadius: "8px",
          fontSize: "0.85rem",
          color: "#a10d0d",
          textAlign: "left",
          alignItems: "center",
          display: "flex",
          flexDirection: "column"
        }}>
          <strong>⚠️ CK APP, Instagram 用戶提示</strong>
          <p style={{ margin: "8px 0 0 0", lineHeight: "1.5" }}>
            CK APP 或是 Instagram 用戶請使用外部瀏覽器(例：Safari, Google...)，否則無法登入成功
          </p>
          <button 
            onClick={() => {
              window.open('souvenir.cksc.tw', '_blank');
            }}
            style={{
              display: "flex",
              marginTop: "8px",
              padding: "8px 12px",
              background: "#dd2476",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            開啟外部瀏覽器
          </button><br />
            （若無法開啟，請手動複製網址到外部瀏覽器）
          <button 
            onClick={() => {
              navigator.clipboard.writeText('souvenir.cksc.tw');
              showToast("已複製網址到剪貼簿");
            }}
            style={{
              display: "flex",
              marginTop: "8px",
              padding: "8px 12px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            複製網址
          </button>
        </div>
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
          {isLoading ? (
            <>
              <div style={{
                width: "20px",
                height: "20px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #3c4043",
                borderRadius: "50%",
                marginRight: "12px",
                animation: "spin 1s linear infinite"
              }} />
              處理中...
            </>
          ) : (
            <>
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
              Sign in with Google
            </>
          )}
        </button>

        {/* 同意使用者條款 */}
        <label style={{ 
          marginTop: "20px", 
          fontSize: "0.9rem", 
          color: "#555", 
          textAlign: "center", 
          display: "block",
          cursor: "pointer"
        }}>
          <input 
            type="checkbox" 
            checked={agree} 
            onChange={() => setAgree(!agree)} 
            style={{ marginRight: "8px", cursor: "pointer" }}
          />
          我已閱讀並同意 <Link to="/terms" style={{ color: "#667eea", fontWeight: "bold" }}>使用者條款</Link>
        </label>
      </div>

      {/* 載入動畫的 CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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