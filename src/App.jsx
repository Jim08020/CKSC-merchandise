import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import AuthPage from "./components/Authpage";
import HomePage from "./components/Home";
import CartPage from "./components/Cartpage";
import OrdersPage from "./components/OrderPage";
import ProductPage from "./components/Productpage"; 
import ToastProvider, { useToast } from "./components/ToastContext";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  const handleSignOut = async () => {
    await signOut(auth);
    showToast("已登出");
    setUser(null);
  };

  return (
    <Router>
      <div style={{ padding: "10px", marginBottom: "20px", borderBottom: "1px solid #ccc" }}>
        {user && (
          <>
            <span>登入狀態</span>
            <button
              onClick={handleSignOut}
              style={{ marginLeft: "20px", padding: "5px 10px" }}
            >
              登出
            </button>
          </>
        )}
      </div>

      <Routes>
        {!user ? (
          <Route path="*" element={<AuthPage />} />
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default function AppWrapper() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}
