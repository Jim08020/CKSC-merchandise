import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "./ToastContext";

export default function OrderdetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [userRole, setUserRole] = useState("");

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

  // 檢查管理員和 Manager 權限
  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsManager(false);
        setCheckingPermission(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;
          setUserRole(role);
          
          // 檢查是否為 admin 或 manager
          setIsAdmin(role === "admin");
          setIsManager(role === "manager");
        } else {
          setIsAdmin(false);
          setIsManager(false);
        }
      } catch (error) {
        console.error("檢查權限失敗:", error);
        setIsAdmin(false);
        setIsManager(false);
      } finally {
        setCheckingPermission(false);
      }
    };

    checkPermission();
  }, [user]);

  // 取得訂單資料
  useEffect(() => {
    // Admin 或 Manager 都可以訪問
    if ((!isAdmin && !isManager) || checkingPermission) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "orders", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() });
        } else {
          showToast("❌ 找不到這筆訂單");
          navigate("/admin");
        }
      } catch (err) {
        console.error("取得訂單錯誤:", err);
        showToast("❌ 取得訂單失敗：" + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, isAdmin, isManager, checkingPermission, navigate, showToast]);

  // 更新交貨狀態
  const updateDeliveryStatus = async (delivered) => {
    if (!order) return;
    
    setUpdating(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        delivered,
        deliveryUpdatedAt: serverTimestamp(),
        deliveryUpdatedBy: displayName,
        deliveryUpdatedByName: displayName || user.email || "管理員"
      });
      
      // 重新從資料庫獲取最新資料，避免時間戳格式不一致
      const updatedDoc = await getDoc(orderRef);
      if (updatedDoc.exists()) {
        setOrder({ id: updatedDoc.id, ...updatedDoc.data() });
      }

      showToast(delivered ? "✅ 已標記為已交貨" : "📋 已標記為未交貨");
    } catch (err) {
      console.error("更新交貨狀態錯誤:", err);
      showToast("❌ 更新失敗：" + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const updatePaymentStatus = async (paid) => {
    if (!order) return;
    
    setUpdating(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        paid,
        paymentUpdatedAt: serverTimestamp(),
        paymentUpdatedBy: displayName,
        paymentUpdatedByName: displayName || user.email || "管理員"
      });
      
      // 重新從資料庫獲取最新資料，避免時間戳格式不一致
      const updatedDoc = await getDoc(orderRef);
      if (updatedDoc.exists()) {
        setOrder({ id: updatedDoc.id, ...updatedDoc.data() });
      }

      showToast(paid ? "✅ 已標記為已付款" : "📋 已標記為未付款");
    } catch (err) {
      console.error("更新付款狀態錯誤:", err);
      showToast("❌ 更新失敗：" + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // 檢查中
  if (checkingPermission) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔐</div>
          <p style={{ color: "#666" }}>驗證權限中...</p>
        </div>
      </div>
    );
  }

  // 權限不足 (既不是 admin 也不是 manager)
  if (!isAdmin && !isManager) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "20px"
      }}>
        <h2 style={{ color: "#d32f2f", marginBottom: "16px" }}>⚠️ 權限不足</h2>
        <p style={{ color: "#666", marginBottom: "24px" }}>您沒有權限訪問此頁面</p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 28px",
            background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          回到首頁
        </button>
      </div>
    );
  }

  // 載入中
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⏳</div>
          <p style={{ color: "#666" }}>載入訂單中...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📦</div>
          <p style={{ color: "#666" }}>找不到訂單</p>
        </div>
      </div>
    );
  }

  // 根據角色顯示不同的標識
  const roleDisplay = isAdmin ? "Admin" : "Manager";
  const roleColor = isAdmin ? "#dd2476" : "#0891b2";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxSizing: "border-box",
        }}
      >
        {/* 用戶標識 (Admin 或 Manager) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          borderRadius: "12px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          marginBottom: 0,
          background: `linear-gradient(135deg, ${roleColor}15 0%, ${roleColor}05 100%)`,
          border: `1px solid ${roleColor}30`
        }}>
          <img 
            src={user.photoURL || "https://via.placeholder.com/48?text=👤"} 
            alt="User Avatar"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              objectFit: "cover",
              border: `2px solid ${roleColor}`
            }}
          />
          <div>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "1rem", color: "#333" }}>
              <span style={{ 
                color: roleColor,
                background: `${roleColor}20`,
                padding: "2px 8px",
                borderRadius: "4px",
                marginRight: "8px",
                fontSize: "0.85rem"
              }}>
                {roleDisplay}
              </span>
              {displayName || "未命名用戶"}
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* 訂單標題 */}
        <h1 style={{ textAlign: "center", marginBottom: "8px", color: "#333" }}>訂單明細</h1>

        {/* 交貨狀態控制區塊 */}
        <div style={{
          background: order.delivered ? "#dcfce7" : "#fef3c7",
          border: `1px solid ${order.delivered ? "#16a34a" : "#f59e0b"}`,
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "8px"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            flexWrap: "wrap",
            gap: "12px"
          }}>
            
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                交貨狀態：
                <span style={{ 
                  color: order.delivered ? "#16a34a" : "#f59e0b",
                  marginLeft: "8px"
                }}>
                  {order.delivered ? "✅ 已交貨" : "⏳ 未交貨"}
                </span>
              </div>
              {order.deliveryUpdatedAt && (
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  最後更新：{order.deliveryUpdatedAt.toDate ? 
                    order.deliveryUpdatedAt.toDate().toLocaleString() : 
                    order.deliveryUpdatedAt.toLocaleString()
                  }
                  {order.deliveryUpdatedByName && ` (${order.deliveryUpdatedByName})`}
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => updateDeliveryStatus(true)}
                disabled={updating || order.delivered}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: order.delivered ? "#94a3b8" : "#16a34a",
                  color: "white",
                  fontWeight: "bold",
                  cursor: order.delivered || updating ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {updating ? "更新中..." : "標記已交貨"}
              </button>
              
              <button
                onClick={() => updateDeliveryStatus(false)}
                disabled={updating || !order.delivered}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: !order.delivered ? "#94a3b8" : "#f59e0b",
                  color: "white",
                  fontWeight: "bold",
                  cursor: !order.delivered || updating ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {updating ? "更新中..." : "標記未交貨"}
              </button>
            </div>
          </div>
        </div>

        {/* 付款狀態區域 */}
        <div style={{
          background: order.paid ? "#dcfce7" : "#fef3c7",
          border: `1px solid ${order.paid ? "#16a34a" : "#f59e0b"}`,
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "8px"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            flexWrap: "wrap",
            gap: "12px"
          }}>
            
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                付款狀態：
                <span style={{ 
                  color: order.paid ? "#16a34a" : "#f59e0b",
                  marginLeft: "8px"
                }}>
                  {order.paid ? "✅ 已付款" : "⏳ 未付款"}
                </span>
              </div>
              {order.paymentUpdatedAt && (
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  最後更新：{order.paymentUpdatedAt.toDate ? 
                    order.paymentUpdatedAt.toDate().toLocaleString() : 
                    order.paymentUpdatedAt.toLocaleString()
                  }
                  {order.paymentUpdatedByName && ` (${order.paymentUpdatedByName})`}
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => updatePaymentStatus(true)}
                disabled={updating || order.paid}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: order.paid ? "#94a3b8" : "#16a34a",
                  color: "white",
                  fontWeight: "bold",
                  cursor: order.paid || updating ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {updating ? "更新中..." : "標記已付款"}
              </button>
              
              <button
                onClick={() => updatePaymentStatus(false)}
                disabled={updating || !order.paid}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: !order.paid ? "#94a3b8" : "#f59e0b",
                  color: "white",
                  fontWeight: "bold",
                  cursor: !order.paid || updating ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {updating ? "更新中..." : "標記未付款"}
              </button>
            </div>
          </div>
        </div>

        {/* 訂單資訊網格 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {/* 訂單ID與購買時間 */}
          <div style={{ background: "#f9fafb", borderRadius: "10px", padding: "12px" }}>
            <div style={{ color: "#666", fontSize: "0.9rem" }}>訂單ID</div>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", wordBreak: "break-all" }}>{order.id}</div>
            <br />
            <div style={{ color: "#666", fontSize: "0.9rem" }}>購買時間</div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              {order.createdAt?.toDate().toLocaleString()}
            </div>
          </div>

          {/* 折扣後金額 */}
          <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "10px", padding: "12px" }}>
            <div style={{ color: "#166534", fontSize: "0.9rem" }}>折扣後金額</div>
            <div style={{ fontWeight: 700, color: "#065f46" }}>NT$ {order.finalTotal}</div>
          </div>

        {/* 折扣 */}
        <div style={{ background: "#fff0f6", border: "1px solid #ffffffff", borderRadius: "10px", padding: "12px"}}>
        <div style={{ color: "#d63384", fontSize: "0.9rem", marginBottom: "6px", fontWeight: "bold" }}>折扣資訊</div>

          {/* 使用的套組 */}
          {order.appliedCombos && order.appliedCombos.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <div>使用套餐：</div>
              <ul style={{ paddingLeft: "16px", marginTop: "2px" }}>
                {order.appliedCombos.map(combo => (
                  <li key={combo.id}>
                    {combo.name} x {combo.applicableCount}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 原始金額 */}
          {order.appliedCombos && order.appliedCombos.length > 0 && (
            <div style={{ marginBottom: "4px" }}>
              <span>原始金額：</span>
              <span>NT$ {order.originalTotal}</span>
            </div>
          )}
          <br />
          {/* 折扣金額 */}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#d63384", marginTop: "4px" }}>
            <span>折扣：</span>
            <span>NT$ {order.totalDiscount}</span>
          </div>
        </div>

          {/* 客戶資料 */}
          {(order.customerName || order.customerPhone || order.customerEmail || order.school || order.classNumber) && (
            <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "10px", padding: "12px", overflowWrap: "break-word" }}>
              <div style={{ color: "#1d4ed8", fontSize: "0.9rem", marginBottom: 4 }}>客戶資料</div>
              {order.customerName && <div style={{ fontSize: "0.9rem" }}>姓名：{order.customerName}</div>}
              {order.customerPhone && <div style={{ fontSize: "0.9rem" }}>電話：{order.customerPhone}</div>}
              {order.customerEmail && <div style={{ fontSize: "0.9rem",}}>Email：{order.customerEmail}</div>}
              {order.school && <div style={{ fontSize: "0.9rem" }}>學校：{order.school}</div>}
              {order.classNumber && <div style={{ fontSize: "0.9rem" }}>班級座號：{order.classNumber}</div>}
            </div>
          )}
        </div>

        {/* 商品清單 */}
        <div style={{
          background: "#f9f9f9",
          borderRadius: "8px",
          padding: "16px",
          flex: "1",
          overflow: "auto"
        }}>
          <div style={{
            fontWeight: "600",
            marginBottom: "12px",
            fontSize: "1rem",
            color: "#333"
          }}>
            購買商品
          </div>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
            backgroundColor: "white",
            borderRadius: "4px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <thead>
              <tr style={{
                backgroundColor: "#f3f4f6",
                borderBottom: "1px solid #e5e7eb"
              }}>
                <th style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#374151"
                }}>
                  商品名稱
                </th>
                <th style={{
                  padding: "12px 16px",
                  textAlign: "center",
                  fontWeight: "600",
                  color: "#374151"
                }}>
                  數量
                </th>
                <th style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: "#374151"
                }}>
                  價格
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id} style={{
                  borderBottom: "1px solid #f3f4f6",
                  transition: "background-color 0.2s"
                }}>
                  <td style={{
                    padding: "12px 16px",
                    color: "#374151"
                  }}>
                    {item.name}
                  </td>
                  <td style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    color: "#6b7280"
                  }}>
                    {item.quantity}
                  </td>
                  <td style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    color: "#059669",
                    fontWeight: "500"
                  }}>
                    NT$ {item.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 返回按鈕 */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "white",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            回到首頁
          </button>
          <button
            onClick={() => navigate("/admin")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            回到訂單列表
          </button>
        </div>
      </div>
    </div>
  );
}