import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "./ToastContext";

export default function OrderdetailPage() {
  const { id } = useParams(); // 從 /order/:id 拿到訂單ID
  const [order, setOrder] = useState(null);
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 檢查管理員權限
  useEffect(() => {
    const checkAdminPermission = () => {
      if (!user) {
        showToast("❌ 請先登入");
        navigate("/login");
        return;
      }

      const adminEmails = [
        "ckhssc@gl.ck.tp.edu.tw", //班聯公務信箱
        "ck11300333@gl.ck.tp.edu.tw", //80-1主席，網站管理員
        "chris20090731@gmail.com", //同上
        "ck11300329@gl.ck.tp.edu.tw", //80-1資訊長，網站管理員
        "ck11300569@gl.ck.tp.edu.tw", //80-1服務長
        "ck11300110@gl.ck.tp.edu.tw", //80-1副主席
        "ck11300044@gl.ck.tp.edu.tw", //80-1服務執行
      ];
        
      if (adminEmails.includes(user.email)) {
        setIsAdmin(true);
      } else {
        showToast("❌ 您沒有權限查看此頁面");
        navigate("/");
        return;
      }
      
      setLoading(false);
    };

    checkAdminPermission();
  }, [user, navigate, showToast]);

  // 取得訂單資料
  useEffect(() => {
    if (!isAdmin) return;

    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() });
        } else {
          showToast("❌ 找不到這筆訂單");
          navigate("/orders"); // 找不到回列表
        }
      } catch (err) {
        console.error("取得訂單錯誤:", err);
        showToast("❌ 取得訂單失敗：" + err.message);
      }
    };

    fetchOrder();
  }, [id, isAdmin, navigate, showToast]);

  // 更新交貨狀態
  const updateDeliveryStatus = async (delivered) => {
    if (!order) return;
    
    setUpdating(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      const updateData = {
        delivered,
        deliveryUpdatedAt: serverTimestamp(),
        deliveryUpdatedBy: user.uid,
        deliveryUpdatedByName: user.displayName || user.email || "管理員"
      };

      await updateDoc(orderRef, updateData);
      
      // 更新本地狀態
      setOrder(prev => ({
        ...prev,
        ...updateData,
        deliveryUpdatedAt: new Date() // 用當前時間作為臨時顯示
      }));

      showToast(delivered ? "✅ 已標記為已交貨" : "📋 已標記為未交貨");
    } catch (err) {
      console.error("更新交貨狀態錯誤:", err);
      showToast("❌ 更新失敗：" + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p>檢查權限中...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // 已在 useEffect 中處理重導向
  }

  if (!order) {
    return <p style={{ textAlign: "center", marginTop: "40px" }}>載入中...</p>;
  }

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
        {/* 管理員標識 */}
        <div style={{
          background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
          color: "white",
          padding: "8px 16px",
          borderRadius: "6px",
          textAlign: "center",
          fontSize: "0.9rem",
          fontWeight: "bold"
        }}>
          🔐 管理員模式
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
        <div style={{ background: "#fff0f6", border: "1px solid #f9c2d3", borderRadius: "10px", padding: "12px", marginTop: "16px" }}>
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
            <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "10px", padding: "12px" }}>
              <div style={{ color: "#1d4ed8", fontSize: "0.9rem", marginBottom: 4 }}>客戶資料</div>
              {order.customerName && <div style={{ fontSize: "0.9rem" }}>姓名：{order.customerName}</div>}
              {order.customerPhone && <div style={{ fontSize: "0.9rem" }}>電話：{order.customerPhone}</div>}
              {order.customerEmail && <div style={{ fontSize: "0.9rem" }}>Email：{order.customerEmail}</div>}
              {order.school && <div style={{ fontSize: "0.9rem" }}>學校：{order.school}</div>}
              {order.classNumber && <div style={{ fontSize: "0.9rem" }}>班級座號：{order.classNumber}</div>}
            </div>
          )}
        </div>

        {/* 商品清單 */}
        <div style={{ background: "#f9f9f9", borderRadius: "10px", padding: "16px", overflowX: "auto" }}>
          <strong>商品清單：</strong>
          <ul style={{ marginTop: "8px" }}>
            {order.items.map(item => (
              <li key={item.id} style={{ marginBottom: "4px" }}>
                {item.name} x {item.quantity}（NT$ {item.price * item.quantity}）
              </li>
            ))}
          </ul>
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