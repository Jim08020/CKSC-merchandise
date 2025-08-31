import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ToastContext";

export default function InformationPage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [classandnumber, setClassandnumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // 檢查使用者是否已登入
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.displayName || "");
      } else {
        // 如果沒有登入，重定向到登入頁
        navigate("/auth");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 儲存使用者完整資料
  const saveCompleteUserData = async (user, additionalData) => {
    try {
      const userRef = doc(db, "users", user.uid);
      
      await setDoc(userRef, {
        name: additionalData.name || user.displayName || "",
        phone: additionalData.phone || "",
        email: user.email,
        school: additionalData.school || "",
        classandnumber: additionalData.classandnumber || "",
        googleId: user.uid,
        photoURL: user.photoURL || "",
        createdAt: new Date(),
        authMethod: "google",
        profileCompleted: true
      });
      
      return true;
    } catch (error) {
      console.error("Error saving user data:", error);
      return false;
    }
  };

  // 完成註冊資料填寫
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      showToast("請填寫姓名和電話");
      return;
    }

    try {
      setIsLoading(true);
      
      const success = await saveCompleteUserData(user, {
        name: name.trim(),
        phone: phone.trim(),
        school: school.trim(),
        classandnumber: classandnumber.trim()
      });
      
      if (success) {
        showToast("註冊完成！歡迎使用");
        navigate("/");
      } else {
        showToast("儲存資料失敗，請重試");
      }
    } catch (error) {
      console.error("Complete registration error:", error);
      showToast("註冊失敗：" + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (window.confirm("確定要取消註冊嗎？")) {
      try {
        await signOut(auth);
        showToast("已取消註冊");
        navigate("/auth");
      } catch (error) {
        console.error("Sign out error:", error);
        showToast("登出失敗");
      }
    }
  };

  // 如果還沒有用戶資訊，顯示載入狀態
  if (!user) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
      }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ marginBottom: "16px", fontSize: "1.1rem" }}>載入中...</div>
          <div style={{ fontSize: "0.9rem" }}>正在驗證您的登入狀態</div>
        </div>
      </div>
    );
  }

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
          padding: "32px 24px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
        className="user-info-card"
      >
        <h1 style={{ marginBottom: "16px", color: "#333", fontSize: "1.4rem" }}>
          資料表
        </h1>
        
        <p style={{ marginBottom: "24px", color: "#666", fontSize: "0.95rem" }}>
          請填寫以下資料完成註冊
        </p>
        
        {/* 顯示 Google 使用者資訊 */}
        <div style={{ 
          marginBottom: "24px", 
          padding: "16px", 
          background: "#f8f9ff", 
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "50%",
                border: "2px solid #e1e5f2"
              }}
            />
          )}
          <div style={{ textAlign: "left", flex: 1 }}>
            <p style={{ margin: 0, fontWeight: "bold", color: "#333", fontSize: "1rem" }}>
              {user.displayName}
            </p>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
              {user.email}
            </p>
          </div>
          <div style={{ fontSize: "1.2rem" }}>✅</div>
        </div>

        <form onSubmit={handleCompleteRegistration} style={{ display: "flex", flexDirection: "column" }}>
          <input
            type="text"
            placeholder="姓名 *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="電話 *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="學校（如為友校或本校學生請填寫）"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="班級座號（如為友校或本校學生請填寫）"
            value={classandnumber}
            onChange={(e) => setClassandnumber(e.target.value)}
            style={inputStyle}
          />

          <p style={{ 
            margin: "16px 0 8px", 
            fontSize: "0.85rem", 
            color: "#888",
            textAlign: "left"
          }}>
            * 為必填欄位
          </p>

          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button 
              type="submit" 
              style={{
                ...submitBtnStyle,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
              disabled={isLoading}
            >
              {isLoading ? "儲存中..." : "完成註冊"}
            </button>
            <button
              type="button"
              onClick={handleCancelRegistration}
              style={cancelBtnStyle}
              disabled={isLoading}
            >
              取消
            </button>
          </div>
        </form>

        {/* 安全提示 */}
        <div style={{ 
          marginTop: "20px", 
          padding: "12px", 
          background: "#f0f8ff", 
          borderRadius: "6px",
          fontSize: "0.85rem",
          color: "#0066cc",
          textAlign: "left"
        }}>
          <div style={{ textAlign: "center" , fontWeight: "bold", marginBottom: "4px" }}>隱私安全</div>
          <div style={{textAlign: "center"}}>您的資料將安全儲存，僅用於系統功能，不會外洩給第三方</div>
        </div>
      </div>
    </div>
  );
}

// 樣式定義
const inputStyle = {
  padding: "12px 16px",
  margin: "6px 0",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "1rem",
  outline: "none",
  transition: "border 0.2s",
  width: "100%",
  boxSizing: "border-box"
};

const submitBtnStyle = {
  padding: "12px 20px",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
  color: "white",
  fontWeight: "bold",
  fontSize: "1rem",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(221,36,118,0.25)",
  transition: "all 0.2s ease-in-out",
  flex: 2
};

const cancelBtnStyle = {
  padding: "12px 20px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "white",
  color: "#666",
  fontSize: "1rem",
  cursor: "pointer",
  transition: "all 0.2s",
  flex: 1
};