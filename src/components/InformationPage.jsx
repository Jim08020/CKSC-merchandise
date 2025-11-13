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
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [ck, setck] = useState(false);
  const [tfg, settfg] = useState(false);
  const [zs, setzs] = useState(false);
  const [jm, setjm] = useState(false);
  const [cg, setcg] = useState(false);
  const [hsnu, sethsnu] = useState(false);
  const [parents, setparents] = useState(false);
  const [others, setothers] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser);
      } else {
        navigate("/auth");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadUserData = async (currentUser) => {
    try {
      setIsLoadingUserData(true);
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setName(userData.name || "");
        setPhone(userData.phone || "");
        setSchool(userData.school || "");
        setClassandnumber(userData.classandnumber || "");
        
        setOriginalData(userData);
        setIsEditMode(true);
      } else {
        setName("");
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      showToast("載入資料失敗");
      setName(currentUser.displayName || "");
    } finally {
      setIsLoadingUserData(false);
    }
  };

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

      if (!isUpdate) {
        userData.createdAt = new Date();
      }
      
      await setDoc(userRef, userData, { merge: true });
      
      return true;
    } catch (error) {
      console.error("Error saving user data:", error);
      return false;
    }
  };

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
          setOriginalData({
            ...originalData,
            name: name.trim(),
            phone: phone.trim(),
            school: school.trim(),
            classandnumber: classandnumber.trim(),
          });
        } else {
          showToast("註冊完成！歡迎使用");
          setTimeout(() => {
            navigate("/");
          }, 1000);
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

  const handleGoHome = () => {
    navigate("/");
  };

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

  const setallfalse = () => {
    setck(false);
    settfg(false);
    setzs(false);
    setjm(false);
    setcg(false);
    sethsnu(false);
    setparents(false);
    setothers(false);
  };

  const checkck = () => {
    if (ck == false) {
      setallfalse();
      setck(true); 
      setSchool("建國中學");
    } else {
      setck(false);
      setSchool("");
    }
  };
  
  const checktfg = () => {
    if (tfg == false) {
      setallfalse();
      settfg(true); 
      setSchool("北一女中");
    } else {
      settfg(false);
      setSchool("");
    }
  };

  const checkzs = () => {
    if (zs == false) {
      setallfalse();
      setzs(true);
      setSchool("中山女高");
    } else {
      setzs(false);
      setSchool("");
    }
  };

  const checkjm = () => {
    if (jm == false) {
      setallfalse();
      setjm(true);
      setSchool("景美女中");
    } else {
      setjm(false);
      setSchool("");
    }
  };

  const checkcg = () => {
    if (cg == false) {
      setallfalse();
      setcg(true);
      setSchool("成功高中");
    } else {
      setcg(false);
      setSchool("");
    }
  };

  const checkhsnu = () => {
    if ( hsnu == false) {
      setallfalse();
      sethsnu(true);
      setSchool("師大附中");
    } else {
      sethsnu(false);
      setSchool("");
    }
  };

  const checkparents = () => {
    if (parents == false) {
      setallfalse();
      setparents(true);
      setSchool("建中家長會");
    } else {
      setparents(false);
      setSchool("");
    }
  };

  const checkothers = () => {
    if (others == false) {
      setallfalse();
      setothers(true);
      setSchool("其他學校或社會人士");
    } else {
      setothers(false);
      setSchool("");
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
            placeholder="姓名 *(請務必填寫本名)"
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
          <div style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "left", display: "block" }}>
            &thinsp;請選擇學校
            <label style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "left", display: "block" }}>
              <input 
                type="checkbox" 
                checked={ck} 
                onChange={() => ( checkck() )} 
                style={{ marginRight: "8px" }}
              />
              建國中學
            </label>
            <label style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "left", display: "block" }}>
              <input 
                type="checkbox" 
                checked={tfg} 
                onChange={() => ( checktfg() )} 
                style={{ marginRight: "8px" }}
              />
              北一女中
            </label>
            <label style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "left", display: "block" }}>
              <input 
                type="checkbox" 
                checked={zs} 
                onChange={() => ( checkzs() )} 
                style={{ marginRight: "8px" }}
              />
              中山女高
            </label>
            <label style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "left", display: "block" }}>
              <input 
                type="checkbox" 
                checked={jm} 
                onChange={() => ( checkjm() )} 
                style={{ marginRight: "8px" }}
              />
              景美女中
            </label>
          <label style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "left", display: "block" }}>
              <input 
                type="checkbox" 
                checked={cg} 
                onChange={() => ( checkcg() )} 
                style={{ marginRight: "8px" }}
              />
              成功高中
            </label>
            <label style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "left", display: "block" }}>
              <input 
                type="checkbox" 
                checked={hsnu} 
                onChange={() => ( checkhsnu() )} 
                style={{ marginRight: "8px" }}
              />
              師大附中
            </label>
            <label style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "left", display: "block" }}>
              <input 
                type="checkbox" 
                checked={parents} 
                onChange={() => ( checkparents() )} 
                style={{ marginRight: "8px" }}
              />
              建中家長會
            </label>
            <label style={{ marginTop: "20px", fontSize: "0.9rem", color: "#555", textAlign: "left", display: "block" }}>
              <input 
                type="checkbox" 
                checked={others} 
                onChange={() => ( checkothers() )} 
                style={{ marginRight: "8px" }}
              />
              其他學校或社會人士
            </label><br />
          </div>
          <input
            type="text"
            placeholder="學校 *"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="text"
            placeholder="班級座號（如為友校或本校學生請填寫）"
            value={classandnumber}
            onChange={(e) => setClassandnumber(e.target.value)}
            style={inputStyle}
            required={school === "建國中學" || school === "北一女中" || school === "中山女高" || school === "景美女中" || school === "成功高中" || school === "師大附中"}
          />

          <p style={{ 
            margin: "16px 0 8px", 
            fontSize: "0.85rem", 
            color: "#888",
            textAlign: "left"
          }}>
            * 為必填欄位
          </p>

          <p style={{
            margin: "16px 0 8px", 
            fontSize: "0.85rem", 
            color: "#ff0000ff",
            textAlign: "left"
          }}>需填寫完所有資料才能前往首頁</p>

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
                  disabled={isLoading || name.trim() === "" || phone.trim() === "" || school.trim() === ""}
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