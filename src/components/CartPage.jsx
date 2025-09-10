import React, { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "./ToastContext";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, setCartItems } = useCart();
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 從 Firebase 載入用戶的購物車
  const loadUserCart = async (userId) => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const cartRef = doc(db, "carts", userId);
      const cartSnap = await getDoc(cartRef);
      
      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        if (cartData.items && Array.isArray(cartData.items)) {
          setCartItems(cartData.items);
        }
      }
    } catch (error) {
      console.error("載入購物車失敗:", error);
      showToast("載入購物車失敗，請重新整理頁面");
    } finally {
      setIsLoading(false);
    }
  };

  // 儲存購物車到 Firebase
  const saveUserCart = async (userId, items) => {
    if (!userId || isSyncing) return;
    
    try {
      setIsSyncing(true);
      const cartRef = doc(db, "carts", userId);
      await setDoc(cartRef, {
        items: items,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("儲存購物車失敗:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 用戶登入時載入購物車
  useEffect(() => {
    if (user?.uid) {
      loadUserCart(user.uid);
    }
  }, [user]);

  // 購物車變化時自動儲存（防抖動）
  useEffect(() => {
    if (!user?.uid) return;

    const timeoutId = setTimeout(() => {
      saveUserCart(user.uid, cartItems);
    }, 1000); // 1秒後儲存

    return () => clearTimeout(timeoutId);
  }, [cartItems, user]);

  const comboDeals = [
    { id: "combo1", name: "組合包A", items: [1, 3], discount: 50 },
    { id: "combo2", name: "組合包B", items: [5, 6, 7], discount: 100 },
    { id: "combo3", name: "組合包C", items: [1, 2, 3, 4], discount: 150 },
  ];

  const checkComboDeals = () => {
    const itemQuantities = {};
    cartItems.forEach(item => {
      if (item.no) itemQuantities[item.no] = item.quantity;
    });

    const possibleCombos = [];
    comboDeals.forEach(combo => {
      const hasAllItems = combo.items.every(itemNo => itemQuantities[itemNo] >= 1);
      if (hasAllItems) {
        const maxPossibleCount = Math.min(...combo.items.map(itemNo => itemQuantities[itemNo]));
        possibleCombos.push({ ...combo, maxCount: maxPossibleCount });
      }
    });

    if (possibleCombos.length === 0) return { appliedCombos: [], remainingItems: itemQuantities, totalDiscount: 0 };

    const findOptimalCombination = (combos, quantities) => {
      let bestResult = { totalDiscount: 0, appliedCombos: [], remainingItems: quantities };

      combos.forEach(combo => {
        const canApply = combo.items.every(itemNo => quantities[itemNo] >= 1);
        if (canApply) {
          const maxApplications = Math.min(...combo.items.map(itemNo => quantities[itemNo]));
          for (let count = maxApplications; count >= 1; count--) {
            const newQuantities = { ...quantities };
            combo.items.forEach(itemNo => { newQuantities[itemNo] -= count; });

            const currentDiscount = combo.discount * count;
            const remainingCombos = combos.filter(c => c.id !== combo.id);
            const recursiveResult = remainingCombos.length > 0 
              ? findOptimalCombination(remainingCombos, newQuantities)
              : { totalDiscount: 0, appliedCombos: [], remainingItems: newQuantities };

            const totalDiscount = currentDiscount + recursiveResult.totalDiscount;

            if (totalDiscount > bestResult.totalDiscount) {
              bestResult = {
                totalDiscount,
                appliedCombos: [{ ...combo, applicableCount: count }, ...recursiveResult.appliedCombos],
                remainingItems: recursiveResult.remainingItems,
              };
            }
          }
        }
      });

      return bestResult;
    };

    return findOptimalCombination(possibleCombos, itemQuantities);
  };

  const calculatePricing = () => {
    const originalTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const comboResult = checkComboDeals();
    const finalTotal = originalTotal - comboResult.totalDiscount;

    return {
      originalTotal,
      finalTotal,
      totalDiscount: comboResult.totalDiscount,
      appliedCombos: comboResult.appliedCombos,
      remainingItems: comboResult.remainingItems,
    };
  };

  const { originalTotal, finalTotal, totalDiscount, appliedCombos } = calculatePricing();

  const handleQuantityChange = (itemId, change) => {
    const currentItem = cartItems.find(item => item.id === itemId);
    const newQuantity = currentItem.quantity + change;
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      showToast("商品已從購物車移除");
    } else {
      updateQuantity(itemId, change);
    }
  };

  const placeOrder = async () => {
    if (!user || !user.uid) {
      showToast("請先登入！");
      return;
    }
    if (cartItems.length === 0) {
      showToast("購物車是空的！");
      return;
    }

    try {
      const ordersRef = collection(db, "orders");

      let profile = {};
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) profile = userSnap.data();
      } catch {}

      const orderData = {
        userId: user.uid,
        items: cartItems,
        originalTotal,
        finalTotal,
        totalDiscount,
        appliedCombos: appliedCombos.map(combo => ({
          id: combo.id,
          name: combo.name,
          items: combo.items,
          applicableCount: combo.applicableCount,
          discountPerSet: combo.discount,
          totalDiscount: combo.discount * combo.applicableCount
        })),
        createdAt: serverTimestamp(),
        customerName: profile.name || "",
        customerPhone: profile.phone || "",
        customerEmail: user.email || profile.email || "",
        school: profile.school || "",
        classNumber: profile.classNumber || "",
      };

      await addDoc(ordersRef, orderData);

      // 清空購物車並同步到 Firebase
      setCartItems([]);
      await saveUserCart(user.uid, []);

      showToast("訂單已送出！");
      navigate("/orders");
    } catch (err) {
      console.error("送出訂單錯誤:", err);
      showToast("送出訂單失敗：" + err.message);
    }
  };

  // 手動同步購物車
  const syncCart = async () => {
    if (!user?.uid) return;
    await saveUserCart(user.uid, cartItems);
    showToast("購物車已同步");
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.2rem", color: "#666", marginBottom: "10px" }}>載入購物車中...</div>
          <div style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #ff512f", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ width: "100%", maxWidth: "800px", background: "white", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ color: "#333", margin: 0 }}>購物車</h1>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isSyncing && (
                <span style={{ fontSize: "0.9rem", color: "#666" }}>同步中...</span>
              )}
              <button 
                onClick={syncCart}
                disabled={isSyncing}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                  background: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#666"
                }}
              >
                手動同步
              </button>
            </div>
          )}
        </div>

        {!user && (
          <div style={{ 
            background: "#fff3cd", 
            border: "1px solid #ffeaa7", 
            borderRadius: "8px", 
            padding: "12px", 
            marginBottom: "20px",
            textAlign: "center"
          }}>
            <span style={{ color: "#856404" }}>
              請先登入以保存您的購物車內容
            </span>
          </div>
        )}

        {cartItems.length === 0 ? (
          <p style={{ textAlign: "center", color: "#555" }}>購物車是空的</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "10px", border: "1px solid #e0e0e0", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "bold", marginBottom: "4px" }}>{item.name}</p>
                    <p style={{ color: "#888" }}>NT$ {item.price}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => handleQuantityChange(item.id, -1)} style={{ ...qtyBtnStyle }}>-</button>
                    <span style={{ minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.id, 1)} style={qtyBtnStyle}>+</button>
                  </div>
                  &emsp;
                  <button onClick={() => removeFromCart(item.id)} style={removeBtnStyle}>✕</button>
                </div>
              ))}
            </div>

            {appliedCombos.length > 0 && (
              <div style={{ marginTop: "20px", padding: "16px", background: "#fff0f6", borderRadius: "10px", border: "1px solid #f9c2d3" }}>
                <div style={{ color: "#d63384", fontWeight: "bold", fontSize: "1.1rem", marginBottom: "12px" }}>🎉 套餐折扣</div>
                {appliedCombos.map((combo, index) => (
                  <div key={combo.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>{combo.name} x {combo.applicableCount}</span>
                    <span>- NT$ {combo.discount * combo.applicableCount}</span>
                  </div>
                ))}
                <div style={{ textAlign: "right", marginTop: "8px", fontWeight: "bold" }}>總共節省: NT$ {totalDiscount}</div>
              </div>
            )}

            <div style={{ marginTop: "24px", padding: "20px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #e9ecef" }}>
              {totalDiscount > 0 ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#6c757d", textDecoration: "line-through" }}>商品小計：</span>
                    <span style={{ color: "#6c757d" }}>NT$ {originalTotal}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#28a745" }}>套餐優惠：</span>
                    <span style={{ color: "#28a745", fontWeight: "bold" }}>- NT$ {totalDiscount}</span>
                  </div>
                  <hr style={{ borderTop: "1px solid #dee2e6", margin: "12px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "1.2rem", color: "#333" }}>總金額：</strong>
                    <strong style={{ fontSize: "1.3rem", color: "#ff512f" }}>NT$ {finalTotal}</strong>
                  </div>
                  <div style={{ textAlign: "right", color: "#28a745", fontSize: "0.9rem", marginTop: "4px" }}>您已節省 NT$ {totalDiscount}！</div>
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: "1.2rem", color: "#333" }}>總金額：</strong>
                  <strong style={{ fontSize: "1.3rem", color: "#333" }}>NT$ {finalTotal}</strong>
                </div>
              )}
            </div>

            <button style={{ ...gradientBtnStyle, marginTop: "30px", width: "100%", fontSize: "1.1rem", padding: "15px 20px" }} onClick={placeOrder} disabled={!user}>
              {totalDiscount > 0 ? `送出訂單 (已省 NT$ ${totalDiscount})` : "送出訂單"}
            </button>
          </>
        )}

        <button onClick={() => navigate("/")} style={{ ...gradientBtnStyle, marginTop: "15px", width: "100%", background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)" }}>回到首頁</button>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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