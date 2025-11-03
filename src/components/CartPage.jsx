import React, { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "./ToastContext";
import { comboDeals } from "./Data";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, setCartItems } = useCart();
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [usePRPackage, setUsePRPackage] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState("");
  
    useEffect(() => {
      if (!user) return;
      const fetchName = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setDisplayName(userDoc.data().name || user.displayName || user.email);
          } else {
            setDisplayName(user.displayName || user.email);
          }
        } catch {
          setDisplayName(user.displayName || user.email);
        }
      };
      fetchName();
    }, [user]);
  // 從 Firebase 載入用戶資料
  const loadUserProfile = async (userId) => {
    if (!userId) return;
    
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profile = userSnap.data();
        setUserProfile(profile);
        return profile;
      }
    } catch (error) {
      console.error("載入用戶資料失敗:", error);
    }
    return null;
  };

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

  // 用戶登入時載入購物車和用戶資料
  useEffect(() => {
    if (user?.uid) {
      loadUserCart(user.uid);
      loadUserProfile(user.uid);
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
  

  // 管理員郵箱列表
  const adminEmails = [
    "ck11300333@gl.ck.tp.edu.tw", //80-1主席，網站管理員
    "chris20090731@gmail.com", //同上
    "ck11300329@gl.ck.tp.edu.tw", //80-1資訊長，網站管理員
    "ck11300569@gl.ck.tp.edu.tw", //80-1服務長
    "ck11300110@gl.ck.tp.edu.tw", //80-1副主席
    "ck11300044@gl.ck.tp.edu.tw", //80-1服務執行王猷巽
    "ck11300307@gl.ck.tp.edu.tw", //80-1服務執行洪鈵椉
    "ck11300554@gl.ck.tp.edu.tw", //80-1服務執行陳謙行
    "stud2@gl.ck.tp.edu.tw",//社團活動組楊蕙瑜組長
  ];

  // 檢查是否為管理員 (使用郵箱檢查)
  const isAdmin = user?.email && adminEmails.includes(user.email);

  const checkComboDeals = () => {
    const itemQuantities = {};
    cartItems.forEach(item => {
      if (item.no) {
        itemQuantities[item.no] = (itemQuantities[item.no] || 0) + item.quantity;
      }
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
    
    // 檢查購物車中是否有徽章(8)或鑰匙圈(7)
    const giftItems = cartItems.filter(item => item.no === 7 || item.no === 8);
    const hasGiftItem = giftItems.length > 0;
    
    // 如果是管理員且選擇使用公關品組合包，則免除所有金額
    if (isAdmin && usePRPackage) {
      return {
        originalTotal,
        finalTotal: 0,
        totalDiscount: originalTotal,
        appliedCombos: [],
        prPackageApplied: true,
        prPackageDiscount: originalTotal,
        qualifiesForGift: false,
        giftDiscount: 0,
        hasGiftItem: false
      };
    }
    
    // 先計算扣除組合優惠後的總額
    let currentTotal = originalTotal - comboResult.totalDiscount;
    let giftDiscount = 0;
    
    // 判斷是否符合滿額資格：當前總額（包含贈品） >= 1500
    const qualifiesForGift = currentTotal >= 1500;
    
    // 如果符合資格且購物車有贈品，則扣除一個贈品的價格
    if (hasGiftItem && qualifiesForGift) {
      giftDiscount = giftItems[0].price;
      currentTotal = currentTotal - giftDiscount;
    }

    return {
      originalTotal,
      finalTotal: currentTotal,
      totalDiscount: comboResult.totalDiscount,
      appliedCombos: comboResult.appliedCombos,
      remainingItems: comboResult.remainingItems,
      prPackageApplied: false,
      prPackageDiscount: 0,
      qualifiesForGift,
      giftDiscount,
      hasGiftItem
    };
  };

  const { originalTotal, finalTotal, totalDiscount, appliedCombos, prPackageApplied, prPackageDiscount, qualifiesForGift, giftDiscount, hasGiftItem } = calculatePricing();

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

      let profile = userProfile || {};
      if (!profile.name) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) profile = userSnap.data();
        } catch {}
      }

      const orderData = {
        userId: user.uid,
        items: cartItems,
        originalTotal,
        finalTotal,
        totalDiscount: prPackageApplied ? prPackageDiscount : (totalDiscount + giftDiscount),
        // 如果使用公關品，則在 appliedCombos 中記錄公關品
        appliedCombos: prPackageApplied 
          ? [{ name: "公關品" }]
          : appliedCombos.map(combo => ({
              id: combo.id,
              name: combo.name,
              items: combo.items,
              applicableCount: combo.applicableCount,
              discountPerSet: combo.discount,
              totalDiscount: combo.discount * combo.applicableCount
            })),
        prPackageUsed: prPackageApplied,
        prPackageDiscount: prPackageApplied ? prPackageDiscount : 0,
        isAdminOrder: isAdmin,
        qualifiesForGift: qualifiesForGift && !prPackageApplied,
        giftDiscount: giftDiscount,
        hasGiftItem: hasGiftItem,
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
      setUsePRPackage(false); // 重置公關品選項

      showToast("訂單已送出！");
      navigate("/orders");
    } catch (err) {
      console.error("送出訂單錯誤:", err);
      showToast("送出訂單失敗：" + err.message);
    }
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
        <h1 style={{ color: "#333", margin: 0 , textAlign: "center" }}>購物車</h1><br />
        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
            {isAdmin && (
              <span style={{ 
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                borderRadius: "12px",
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
                    border: "2px solid #ddd",
                    display: "flex"
                  }}
                />
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "1rem", color: "#333" }}>
                  Admin-{displayName || "未命名用戶"}
                </p>
              </span>
            )}
          </div>
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

        {/* 管理員公關品組合包選項 */}
        {isAdmin && cartItems.length > 0 && (
          <div style={{ 
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
            border: "none",
            borderRadius: "12px", 
            padding: "16px", 
            marginBottom: "20px",
            color: "white"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>管理員專用</div>
                <div style={{ fontSize: "0.9rem", opacity: "0.9" }}>公關品 - 免除所有金額</div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={usePRPackage}
                  onChange={(e) => setUsePRPackage(e.target.checked)}
                  style={{ transform: "scale(1.2)" }}
                />
                <span style={{ fontWeight: "bold" }}>使用公關品</span>
              </label>
            </div>
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

            {/* 公關品組合包折扣顯示 */}
            {prPackageApplied && (
              <div style={{ marginTop: "20px", padding: "16px", background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)", borderRadius: "10px", border: "2px solid #667eea" }}>
                <div style={{ color: "#667eea", fontWeight: "bold", fontSize: "1.1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  公關品
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>僅限公關場合得使用，並應獲得主席之准許</span>
                </div>
              </div>
            )}

            {/* 一般組合包折扣顯示 */}
            {!prPackageApplied && appliedCombos.length > 0 && (
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

            {/* 滿額贈品提示 */}
            {!prPackageApplied && (
              <div style={{ 
                marginTop: "20px", 
                padding: "16px", 
                background: qualifiesForGift && hasGiftItem ? "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)" : qualifiesForGift ? "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" : "#fff8e1", 
                borderRadius: "10px", 
                border: qualifiesForGift && hasGiftItem ? "2px solid #f57c00" : qualifiesForGift ? "2px solid #48c6ef" : "1px solid #ffd54f",
                color: qualifiesForGift && hasGiftItem ? "white" : qualifiesForGift ? "#333" : "#333"
              }}>
                <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  🎁 滿額好禮
                </div>
                <div style={{ fontSize: "0.95rem" }}>
                  {qualifiesForGift && hasGiftItem ? (
                    <>
                      <div style={{ marginBottom: "4px" }}>🎊 恭喜！您已符合滿額贈禮資格！</div>
                      <div>滿 NT$ 1500 即可獲得：<strong>徽章 或 鑰匙圈</strong> 免費 (已自動扣除一個贈品 NT$ {giftDiscount})</div>
                    </>
                  ) : qualifiesForGift ? (
                    <>
                      <div style={{ marginBottom: "4px" }}>🎊 恭喜！您已符合滿額贈禮資格！</div>
                      <div>滿 NT$ 1500 即可獲得：<strong>徽章 或 鑰匙圈</strong> 乙份 (請將贈品加入購物車，系統將自動扣除一個贈品的金額)</div>
                    </>
                  ) : (
                    <>
                      <div>滿 NT$ 1500 即贈送 <strong>徽章 或 鑰匙圈</strong> 乙份</div>
                      <div style={{ marginTop: "4px", fontSize: "0.9rem", opacity: 0.8 }}>
                        還差 NT$ {1500 - (cartItems.filter(item => item.no !== 7 && item.no !== 8).reduce((sum, item) => sum + item.price * item.quantity, 0) - totalDiscount)} 即可獲得贈品！
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: "24px", padding: "20px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #e9ecef" }}>
              {(totalDiscount > 0 || prPackageApplied || giftDiscount > 0) ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#6c757d", textDecoration: "line-through" }}>商品小計：</span>
                    <span style={{ color: "#6c757d" }}>NT$ {originalTotal}</span>
                  </div>
                  {totalDiscount > 0 && !prPackageApplied && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#28a745" }}>套餐優惠：</span>
                      <span style={{ color: "#28a745", fontWeight: "bold" }}>- NT$ {totalDiscount}</span>
                    </div>
                  )}
                  {giftDiscount > 0 && !prPackageApplied && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#ff9800" }}>滿額贈品：</span>
                      <span style={{ color: "#ff9800", fontWeight: "bold" }}>- NT$ {giftDiscount}</span>
                    </div>
                  )}
                  {prPackageApplied && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#667eea" }}>公關品：</span>
                      <span style={{ color: "#667eea", fontWeight: "bold" }}>- NT$ {prPackageDiscount}</span>
                    </div>
                  )}
                  <hr style={{ borderTop: "1px solid #dee2e6", margin: "12px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "1.2rem", color: "#333" }}>總金額：</strong>
                    <strong style={{ fontSize: "1.3rem", color: prPackageApplied ? "#667eea" : "#ff512f" }}>
                      NT$ {finalTotal}
                    </strong>
                  </div>
                  <div style={{ textAlign: "right", color: prPackageApplied ? "#667eea" : "#28a745", fontSize: "0.9rem", marginTop: "4px" }}>
                    {prPackageApplied 
                      ? "公關品 - 全額免除" 
                      : `您已節省 NT$ ${totalDiscount + giftDiscount}！`
                    }
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: "1.2rem", color: "#333" }}>總金額：</strong>
                  <strong style={{ fontSize: "1.3rem", color: "#333" }}>NT$ {finalTotal}</strong>
                </div>
              )}
            </div>

            <button 
              style={{ 
                ...gradientBtnStyle, 
                marginTop: "30px", 
                width: "100%", 
                fontSize: "1.1rem", 
                padding: "15px 20px",
                background: prPackageApplied 
                  ? "linear-gradient(90deg, #667eea 0%, #764ba2 100%)" 
                  : "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)"
              }} 
              onClick={placeOrder} 
              disabled={!user}
            >
              {prPackageApplied 
                ? `送出公關品` 
                : (totalDiscount > 0 || giftDiscount > 0)
                  ? `送出訂單 (已省 NT$ ${totalDiscount + giftDiscount})` 
                  : "送出訂單"
              }
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