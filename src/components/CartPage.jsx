import React, { useState } from "react";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "./ToastContext";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, setCartItems } = useCart();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = async () => {
    if (!user || !user.uid) {
      showToast("❌ 請先登入！");
      return;
    }

    if (cartItems.length === 0) {
      showToast("❌ 購物車是空的！");
      return;
    }

    try {
      const ordersRef = collection(db, "orders");

      // 讀取使用者資料，帶入訂單（若不存在則以空字串代替）
      let profile = {};
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) profile = userSnap.data();
      } catch {}

      await addDoc(ordersRef, {
        userId: user.uid,
        items: cartItems,
        total,
        createdAt: serverTimestamp(),
        customerName: profile.name || "",
        customerPhone: profile.phone || "",
        customerEmail: user.email || profile.email || "",
        school: profile.school || "",
        classNumber: profile.classNumber || "",
      });

      showToast("✅ 訂單已送出！");
      setCartItems([]);
      navigate("/orders");
    } catch (err) {
      console.error("送出訂單錯誤:", err);
      showToast("❌ 送出訂單失敗：" + err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px 20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "800px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        padding: "30px"
      }}>
        <h1 style={{ textAlign: "center", marginBottom: "24px", color: "#333" }}>購物車</h1>

        {cartItems.length === 0 ? (
          <p style={{ textAlign: "center", color: "#555" }}>購物車是空的</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {cartItems.map(item => (
                <div key={item.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #e0e0e0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "bold", marginBottom: "4px" }}>{item.name}</p>
                    <p style={{ color: "#888" }}>NT$ {item.price}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={qtyBtnStyle}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={qtyBtnStyle}>+</button>
                  </div>
                    &emsp;
                  <button onClick={() => removeFromCart(item.id)} style={removeBtnStyle}>✕</button>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <strong style={{ fontSize: "1.2rem" }}>總金額： NT$ {total}</strong>
            </div>
            <div>
              <button style={{ ...gradientBtnStyle, marginTop: "30px", width: "100%" }} onClick={placeOrder} disabled={!user}>送出訂單</button>
            </div>
          </>
        )}

        <button
          onClick={() => navigate("/")}
          style={{ ...gradientBtnStyle, marginTop: "30px", width: "100%" }}
        >
          回到首頁
        </button>
      </div>
    </div>
  );
}

const qtyBtnStyle = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "none",
  background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.2s",
};

const removeBtnStyle = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "none",
  background: "#ff6b6b",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.2s",
};

const gradientBtnStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(221,36,118,0.25)",
  transition: "all 0.2s",
};
