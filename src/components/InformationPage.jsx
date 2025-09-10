import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ToastContext";

export default function InformationPage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [classandnumber, setClassandnumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false); // 是否為編輯模式
  const [originalData, setOriginalData] = useState(null); // 儲存原始資料
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // 檢查使用者是否已登入
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser);
      } else {
        // 如果沒有登入，重定向到登入頁
        navigate("/auth");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 載入使用者資料
  const loadUserData = async (currentUser) => {
    try {
      setIsLoadingUserData(true);
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // 設定表單資料
        setName(userData.name || currentUser.displayName || "");
        setPhone(userData.phone || "");
        setSchool(userData.school || "");
        setClassandnumber(userData.classandnumber || "");
        
        // 儲存原始資料
        setOriginalData(userData);
        setIsEditMode(true); // 設定為編輯模式
      } else {
        // 新用戶，使用Google資料作為預設值
        setName(currentUser.displayName || "");
        setIsEditMode(false); // 設定為新註冊模式
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      showToast("載入資料失敗");
      setName(currentUser.displayName || "");
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // 儲存使用者完整資料
  const saveCompleteUserData = async (user, additionalData, isUpdate = false) => {
    try {
      const userRef = doc(db, "users", user.uid);
      
      const userData = {
        name: additionalData.name || user.displayName || "",
        phone: additionalData.phone || "",
        email: user.email,
        school: additionalData.school || "",
        classandnumber: additionalData.classandnumber || "",
        googleId: user.uid,
        photoURL: user.photoURL || "",
        authMethod: "google",
        profileCompleted: true,
        updatedAt: new Date()
      };

      // 如果是新註冊，加上創建時間
      if (!isUpdate) {
        userData.createdAt = new Date();
      }
      
      await setDoc(userRef, userData, { merge: true }); // 使用merge避免覆蓋其他欄位
      
      return true;
    } catch (error) {
      console.error("Error saving user data:", error);
      return false;
    }
  };

  // 完成註冊或更新資料
  const handleSubmit = async (e) => {
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
      }, isEditMode);
      
      if (success) {
        if (isEditMode) {
          showToast("資料更新成功！");
          // 更新原始資料
          setOriginalData({
            ...originalData,
            name: name.trim(),
            phone: phone.trim(),
            school: school.trim(),
            classandnumber: classandnumber.trim(),
          });
        } else {
          showToast("註冊完成！歡迎使用");
          navigate("/");
        }
      } else {
        showToast(isEditMode ? "更新資料失敗，請重試" : "儲存資料失敗，請重試");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showToast((isEditMode ? "更新" : "註冊") + "失敗：" + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 取消編輯，恢復原始資料
  const handleCancelEdit = () => {
    if (originalData) {
      setName(originalData.name || "");
      setPhone(originalData.phone || "");
      setSchool(originalData.school || "");
      setClassandnumber(originalData.classandnumber || "");
      showToast("已恢復原始資料");
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

  // 返回首頁
  const handleGoHome = () => {
    navigate("/");
  };

  // 如果還沒有用戶資訊或正在載入用戶資料，顯示載入狀態
  if (!user || isLoadingUserData) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
      }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ marginBottom: "16px", fontSize: "1.1rem" }}>載入中...</div>
          <div style={{ fontSize: "0.9rem" }}>
            {!user ? "正在驗證您的登入狀態" : "正在載入您的資料"}
          </div>
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
          {isEditMode ? "編輯資料" : "資料表"}
        </h1>
        
        <p style={{ marginBottom: "24px", color: "#666", fontSize: "0.95rem" }}>
          {isEditMode ? "修改您的個人資料" : "請填寫以下資料完成註冊"}
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
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

          <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
            <button 
              type="submit" 
              style={{
                ...submitBtnStyle,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                flex: isEditMode ? "1 1 100%" : "2 1 auto"
              }}
              disabled={isLoading}
            >
              {isLoading ? 
                (isEditMode ? "更新中..." : "儲存中...") : 
                (isEditMode ? "更新資料" : "完成註冊")
              }
            </button>
            
            {isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{...cancelBtnStyle, flex: "1 1 48%"}}
                  disabled={isLoading}
                >
                  恢復原始資料
                </button>
                <button
                  type="button"
                  onClick={handleGoHome}
                  style={{...homeBtnStyle, flex: "1 1 48%"}}
                  disabled={isLoading}
                >
                  返回首頁
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCancelRegistration}
                style={{...cancelBtnStyle, flex: "1 1 auto"}}
                disabled={isLoading}
              >
                取消
              </button>
            )}
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

        {/* 如果是編輯模式，顯示最後更新時間 */}
        {isEditMode && originalData && originalData.updatedAt && (
          <div style={{ 
            marginTop: "12px", 
            fontSize: "0.8rem", 
            color: "#999",
            textAlign: "center"
          }}>
            最後更新：{new Date(originalData.updatedAt.toDate ? originalData.updatedAt.toDate() : originalData.updatedAt).toLocaleString('zh-TW')}
          </div>
        )}
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
};

const homeBtnStyle = {
  padding: "12px 20px",
  borderRadius: "8px",
  border: "1px solid #4CAF50",
  background: "#4CAF50",
  color: "white",
  fontSize: "1rem",
  cursor: "pointer",
  transition: "all 0.2s",
};