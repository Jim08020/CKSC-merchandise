import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import AuthPage from "./components/AuthPage";
import HomePage from "./components/Home";
import CartPage from "./components/CartPage";
import OrdersPage from "./components/OrderPage";
import ProductPage from "./components/ProductPage"; 
import RulePage from "./components/RulePage";
import AboutPage from "./components/AboutPage"; 
import AdminPage from "./components/AdminPage";
import OrderdetailPage from "./components/OrderdetailPage";
import InformationPage from "./components/InformationPage";
import ToastProvider, { useToast } from "./components/ToastContext";

const InfoPage = InformationPage;
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const adminEmails = [
        "ckhssc@gl.ck.tp.edu.tw", //班聯公務信箱
        "ck11300333@gl.ck.tp.edu.tw", //80-1主席，網站管理員
        "chris20090731@gmail.com", //同上
        "ck11300329@gl.ck.tp.edu.tw", //80-1資訊長，網站管理員
        "ck11300569@gl.ck.tp.edu.tw", //80-1服務長
        "ck11300110@gl.ck.tp.edu.tw", //80-1副主席
        "ck11300044@gl.ck.tp.edu.tw", //80-1服務執行王猷巽
        "ck11300307@gl.ck.tp.edu.tw", //80-1服務執行洪鈵椉
        "ck11300554@gl.ck.tp.edu.tw", //80-1服務執行陳謙行
        "stud2@gl.ck.tp.edu.tw"//社團活動組楊蕙瑜組長
        ].map(email => email.toLowerCase());

        const isAdmin = adminEmails.includes(currentUser.email.toLowerCase());

        // const isAdmin = tokenResult.claims.admin === true;
        setUser({ ...currentUser, isAdmin });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(120deg, #e0eafc 0%, #cfdef3 100%)"
    }}>
      <p style={{ fontSize: "1.2rem", color: "#333" }}>Loading...</p>
    </div>
  );

  const handleSignOut = async () => {
    await signOut(auth);
    showToast("已登出");
    setUser(null);
    setDrawerOpen(false);
  };

  const drawerBtnStyle = {
    padding: "10px 16px",
    marginBottom: "12px",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(120deg, #e0eafc 0%, #cfdef3 100%)" }}>
      {/* Header */}
      <header
        style={{
          padding: "12px 20px",
          marginBottom: "32px",
          background: "linear-gradient(90deg, #232526 0%, #414345 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        }}
      >
        {/* 左側漢堡菜單 */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            padding: "1px 1px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "white",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          &#9776;
        </button>

        <span style={{ fontSize: "1.0rem", fontWeight: "bold", letterSpacing: "2px" }}>
          建中校慶紀念品訂購系統
        </span>

        {user ? (
          <button
            onClick={() => navigate("/cart")}
            style={{
            padding: "1px 1px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "white",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
          >
            &#x1f6d2;
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            登入 / 註冊
          </button>
        )}
      </header>

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          width: "260px",
          height: "100%",
          background: "#fff",
          boxShadow: drawerOpen ? "2px 0 12px rgba(0,0,0,0.2)" : "none",
          padding: "20px",
          display: drawerOpen ? "flex":"none",
          flexDirection: "column",
          transition: "left 0.3s",
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          style={{
            alignSelf: "flex-end",
            marginBottom: "20px",
            background: "transparent",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          &times;
        </button>

        {user ? (
          <>
            <button onClick={() => { navigate("/"); setDrawerOpen(false); }} style={drawerBtnStyle}>首頁</button>
            <button onClick={() => { navigate("/cart"); setDrawerOpen(false); }} style={drawerBtnStyle}>購物車</button>
            <button onClick={() => { navigate("/orders"); setDrawerOpen(false); }} style={drawerBtnStyle}>我的訂單</button>
            <button onClick={() => { navigate("/rule"); setDrawerOpen(false); }} style={drawerBtnStyle}>使用者條款</button>
            <button onClick={() => { navigate("/about"); setDrawerOpen(false); }} style={drawerBtnStyle}>關於</button>
            {user.isAdmin && (
              <button onClick={() => { navigate("/admin"); setDrawerOpen(false); }} style={drawerBtnStyle}>後台管理</button>
            )}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "auto",
              padding: "12px",
              borderRadius: "12px",
              background: "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              marginBottom: 0,
            }}>
              <img 
                src={user.photoURL || "https://via.placeholder.com/48?text=👤"} 
                alt="User Avatar"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #ddd"
                }}
              />
              <div>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "1rem", color: "#333" }}>
                  {user.displayName || "未命名用戶"}
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                ...drawerBtnStyle,
                marginTop: 20,
                background: "linear-gradient(90deg, #232526 0%, #414345 100%)",
                marginBottom: 40,
              }}
            >
              登出
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { navigate("/auth"); setDrawerOpen(false); }} style={drawerBtnStyle}>登入 / 註冊</button>
            <button onClick={() => { navigate("/rule"); setDrawerOpen(false); }} style={drawerBtnStyle}>使用者條款</button>
            <button onClick={() => { navigate("/about"); setDrawerOpen(false); }} style={drawerBtnStyle}>關於</button>
          </>
        )}
      </div>

      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.3)",
            zIndex: 900,
          }}
        />
      )}

      {/* Main Content */}
      <main style={{ maxWidth: "900px", margin: "16px auto 0", padding: "0 12px" }}>
        <Routes>
          <>
            <Route path="/rule" element={<RulePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/info" element={<InfoPage />} />
          </>
          {!user ? (
            <>
              <Route path="*" element={<AuthPage />} />
            </>
          ) : (
            <>  
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderdetailPage />} />
              <Route 
                path="/admin" 
                element={user.isAdmin ? <AdminPage /> : <Navigate to="/" replace />} 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <ToastProvider>
      <Router>
        <App />
      </Router>
    </ToastProvider>
  );
}
