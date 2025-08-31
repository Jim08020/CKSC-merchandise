import React, { useState } from "react";
import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  EmailAuthProvider,
  fetchSignInMethodsForEmail
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "./ToastContext";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classandnumber, setClassandnumber] = useState("");
  const [school, setSchool] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState(""); 
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 儲存或更新使用者資料到 Firestore
  const saveUserData = async (user, additionalData = {}) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      // 取得所有認證方式
      const authMethods = user.providerData.map(provider => 
        provider.providerId === 'google.com' ? 'google' : 'email'
      );
      
      if (!userSnap.exists()) {
        // 首次註冊，儲存完整資料
        await setDoc(userRef, {
          name: additionalData.name || user.displayName || "",
          phone: additionalData.phone || "",
          email: user.email,
          school: additionalData.school || "",
          classandnumber: additionalData.classandnumber || "",
          createdAt: new Date(),
          authMethods: authMethods
        });
      } else {
        // 用戶已存在，更新認證方式
        const userData = userSnap.data();
        const currentMethods = userData.authMethods || [];
        const allMethods = [...new Set([...currentMethods, ...authMethods])];
        
        await setDoc(userRef, {
          ...userData,
          authMethods: allMethods
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  // 檢查 Email 的認證方式
  const checkEmailAuthMethods = async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods;
    } catch (error) {
      console.error("Error checking email methods:", error);
      return [];
    }
  };

  // 手動連結 Email/密碼認證方式
  const linkEmailPassword = async (user, email, password) => {
    try {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(user, credential);
      return result;
    } catch (error) {
      console.error("Link email/password error:", error);
      throw error;
    }
  };

  // Google 登入處理
  const handleGoogleSignIn = async () => {
    if (!agree) {
      showToast("❌ 請先閱讀並同意使用者條款");
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 儲存使用者資料
      await saveUserData(user);
      
      showToast("✅ Google 登入成功！");
      navigate("/"); 
    } catch (error) {
      console.error("Google Sign-In error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        showToast("❌ Google 登入被取消");
      } else {
        showToast("❌ Google 登入失敗：" + error.message);
      }
    }
  };

  // Email/密碼 登入/註冊處理
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agree) {
      showToast("❌ 請先閱讀並同意使用者條款");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      showToast("❌ 密碼與確認密碼不一致！");
      return;
    }

    try {
      if (isSignUp) {
        // 檢查 Email 的現有認證方式
        const existingMethods = await checkEmailAuthMethods(email);
        
        if (existingMethods.length > 0) {
          showToast("❌ 此 Email 已經註冊過了，請直接登入");
          setIsSignUp(false);
          return;
        }

        // 建立新帳號
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 儲存使用者資料
        await saveUserData(user, {
          name,
          phone,
          school,
          classandnumber
        });

        showToast("✅ Email 註冊成功！");

        // 詢問是否要連結 Google 帳號
        const shouldLinkGoogle = window.confirm(
          "註冊成功！是否要同時連結 Google 帳號？\n這樣您就可以使用兩種方式登入。"
        );

        if (shouldLinkGoogle) {
          try {
            setIsLinking(true);
            const provider = new GoogleAuthProvider();
            const result = await linkWithPopup(user, provider);
            
            await saveUserData(result.user);
            showToast("🎉 Google 帳號連結成功！您現在可以使用兩種方式登入");
          } catch (linkError) {
            console.error("Link error:", linkError);
            if (linkError.code === 'auth/credential-already-in-use') {
              showToast("⚠️ 該 Google 帳號已被其他使用者使用");
            } else if (linkError.code === 'auth/popup-closed-by-user') {
              showToast("⚠️ Google 連結被取消，您仍可稍後連結");
            } else {
              showToast("⚠️ Google 帳號連結失敗，您仍可稍後連結");
            }
          } finally {
            setIsLinking(false);
          }
        }

        navigate("/"); 
      } else {
        // Email 登入
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          // 更新認證方式記錄
          await saveUserData(userCredential.user);
          
          showToast("✅ 登入成功！");
          navigate("/");
        } catch (signInError) {
          // 如果 Email/密碼登入失敗，檢查是否只有 Google 認證方式
          if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/user-not-found') {
            const methods = await checkEmailAuthMethods(email);
            
            if (methods.includes('google.com') && !methods.includes('password')) {
              showToast("❌ 此帳號僅支援 Google 登入，請使用 Google 登入按鈕");
              return;
            }
          }
          throw signInError; // 重新拋出其他錯誤
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      
      // 提供更詳細的錯誤訊息
      if (error.code === 'auth/user-not-found') {
        showToast("❌ 帳號不存在，請先註冊");
      } else if (error.code === 'auth/wrong-password') {
        showToast("❌ 密碼錯誤，請重新輸入");
      } else if (error.code === 'auth/invalid-credential') {
        showToast("❌ 登入憑證無效，請檢查 Email 和密碼");
      } else if (error.code === 'auth/email-already-in-use') {
        showToast("❌ 此 Email 已經註冊過了");
      } else if (error.code === 'auth/weak-password') {
        showToast("❌ 密碼強度不足，請使用至少 6 個字元");
      } else if (error.code === 'auth/invalid-email') {
        showToast("❌ Email 格式不正確");
      } else {
        showToast("❌ 認證失敗：" + error.message);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "20px",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px 20px",
          maxWidth: "360px",
          width: "100%",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
        className="auth-card"
      >
        <h2 style={{ marginBottom: "24px", color: "#333" }}>
          {isSignUp ? "註冊" : "登入"}
        </h2>

        {/* Google 登入按鈕（登入時顯示） */}
        {!isSignUp && (
          <div style={{ marginBottom: "20px" }}>
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              style={googleBtnStyle}
            >
              <svg
                style={{ width: "18px", height: "18px", marginRight: "8px" }}
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
              使用 Google 登入
            </button>
            
            <div style={{ 
              margin: "16px 0", 
              display: "flex", 
              alignItems: "center", 
              color: "#999" 
            }}>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid #eee" }} />
              <span style={{ padding: "0 12px", fontSize: "0.9rem" }}>或</span>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid #eee" }} />
            </div>
          </div>
        )}

        {/* Email/密碼 表單 */}
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
              <input
                type="text"
                placeholder="學校(如為友校或本校學生請填寫)"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="班級座號(如為友校或本校學生請填寫)"
                value={classandnumber}
                onChange={(e) => setClassandnumber(e.target.value)}
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

          {/* 同意使用者條款 */}
          <label style={{ marginTop: "10px", fontSize: "0.9rem", color: "#555", textAlign: "center" }}>
            <input 
              type="checkbox" 
              checked={agree} 
              onChange={() => setAgree(!agree)} 
              style={{ marginRight: "6px" }}
            />
            我已閱讀並同意 <Link to="/rule" style={{ color: "#667eea", fontWeight: "bold" }}>使用者條款</Link>
          </label>

          <button 
            type="submit" 
            style={{
              ...submitBtnStyle,
              opacity: isLinking ? 0.7 : 1,
              cursor: isLinking ? 'not-allowed' : 'pointer'
            }}
            disabled={isLinking}
          >
            {isLinking ? "正在設定帳號..." : (isSignUp ? "註冊" : "登入")}
          </button>
        </form>

        {/* 註冊時的說明 */}
        {isSignUp && (
          <div style={{ marginTop: "16px", fontSize: "0.9rem", color: "#666", lineHeight: "1.4" }}>
            <p>🔗 註冊完成後，系統會詢問是否連結 Google 帳號</p>
            <p>連結後您可以使用 Email 或 Google 兩種方式登入</p>
          </div>
        )}

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

// 樣式定義
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

const googleBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 20px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "white",
  color: "#333",
  fontSize: "1rem",
  cursor: "pointer",
  width: "100%",
  transition: "all 0.2s",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  marginBottom: "8px"
};