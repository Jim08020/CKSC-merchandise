import React, { useState } from "react";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "./ToastContext";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, setCartItems } = useCart();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
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
      await addDoc(ordersRef, {
        userId: user.uid,
        items: cartItems,
        total,
        createdAt: serverTimestamp(),
      });

      showToast("✅ 訂單已送出！");
      setCartItems([]); // 清空購物車
      navigate("/orders"); // 跳到訂單頁
    } catch (err) {
      console.error("送出訂單錯誤:", err);
      showToast("❌ 送出訂單失敗：" + err.message);
    }
  };

  return (
    <div>
      <h1>購物車</h1>
      {cartItems.length === 0 && <p>購物車是空的</p>}
      {cartItems.map((item) => (
        <div key={item.id} style={{ marginBottom: "10px" }}>
          <span>{item.name} - ${item.price} x {item.quantity}</span>
          <button style={{ marginLeft: "5px" }} onClick={() => updateQuantity(item.id, 1)}>+</button>
          <button style={{ marginLeft: "5px" }} onClick={() => updateQuantity(item.id, -1)}>-</button>
          <button style={{ marginLeft: "5px" }} onClick={() => removeFromCart(item.id)}>❌</button>
        </div>
      ))}

      {cartItems.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <p>總金額: ${total}</p>
          <button onClick={() => setShowQR(true)}>生成 QR code</button>
          <button onClick={placeOrder} style={{ marginLeft: "10px" }} disabled={!user}>送出訂單</button>

          {showQR && (
            <div style={{ marginTop: "20px", border: "1px solid black", display: "inline-block", padding: "10px" }}>
              <QRCodeCanvas value={JSON.stringify(cartItems)} />
              <button style={{ display: "block", marginTop: "10px" }} onClick={() => setShowQR(false)}>關閉</button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        回到首頁
      </button>
    </div>
  );
}
