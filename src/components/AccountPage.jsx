import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useToast } from "./ToastContext";

export default function AdminAccountManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const currentUser = auth.currentUser;

  // 檢查當前用戶是否為管理員
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // 檢查管理員權限
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("檢查管理員權限失敗:", error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        
        const usersList = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            role: data.role || "user"
          };
        });

        setUsers(usersList);
      } catch (error) {
        console.error("獲取使用者資料失敗:", error);
        showToast("獲取使用者資料失敗");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin && !checkingAdmin) {
      fetchUsers();
    }
  }, [isAdmin, checkingAdmin]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // 切換角色 (admin/manager/user)
  const changeUserRole = async (userId, newRole) => {
    const user = users.find(u => u.id === userId);

    // 防止移除自己的管理員權限
    if (userId === currentUser.uid && user.role === "admin" && newRole !== "admin") {
      showToast("無法移除自己的管理員權限");
      return;
    }

    // 檢查是否為最後一個管理員
    const adminCount = users.filter(u => u.role === "admin").length;
    if (adminCount === 1 && user.role === "admin" && newRole !== "admin") {
      showToast("至少需要保留一位管理員");
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      // 更新本地狀態
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, role: newRole }
          : u
      ));

      const roleNames = {
        admin: "管理員",
        manager: "友校管理員",
        user: "一般用戶"
      };

      showToast(`已將用戶角色更改為 ${roleNames[newRole]}，該用戶需重新整理頁面後生效`);
      
      // 如果在彈窗中，也更新選中的用戶
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({...selectedUser, role: newRole});
      }
    } catch (error) {
      console.error("更新權限失敗:", error);
      showToast("更新權限失敗");
    }
  };

  // 刪除使用者
  const deleteUser = async (userId) => {
    // 防止刪除自己
    if (userId === currentUser.uid) {
      showToast("無法刪除自己的帳號");
      return;
    }

    // 防止刪除管理員
    const user = users.find(u => u.id === userId);
    if (user.role === "admin") {
      showToast("無法刪除管理員帳號，請先移除管理員權限");
      return;
    }

    if (!window.confirm("確定要刪除此使用者嗎？此操作無法復原！")) {
      return;
    }

    try {
      // 從 Firestore 刪除使用者資料
      await deleteDoc(doc(db, "users", userId));
      
      setUsers(users.filter(user => user.id !== userId));
      setShowModal(false);
      setSelectedUser(null);
      showToast("使用者已刪除");
    } catch (error) {
      console.error("刪除使用者失敗:", error);
      showToast("刪除失敗");
    }
  };

  // 開啟使用者詳情彈窗
  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // 取得角色顯示資訊
  const getRoleInfo = (role) => {
    const roleMap = {
      admin: { label: "管理員", color: "#1976d2", icon: "👑" },
      manager: { label: "友校管理員", color: "#f57c00", icon: "🔑" },
      user: { label: "一般用戶", color: "#7b1fa2", icon: "👤" }
    };
    return roleMap[role] || roleMap.user;
  };

  // 檢查中
  if (checkingAdmin) {
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

  // 權限不足
  if (!isAdmin) {
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
          <p style={{ color: "#666" }}>載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px 20px",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {/* 標題區 */}
        <div style={{
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <h1 style={{ color: "#333", margin: 0 }}>帳號管理</h1>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 20px",
              background: "#fff",
              border: "2px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            回到首頁
          </button>
        </div>

        {/* 統計卡片 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#4CAF50" }}>
              {users.length}
            </div>
            <div style={{ color: "#666", marginTop: "8px" }}>總使用者數</div>
          </div>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2196F3" }}>
              {users.filter(u => u.role === "admin").length}
            </div>
            <div style={{ color: "#666", marginTop: "8px" }}>👑 管理員</div>
          </div>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#FF9800" }}>
              {users.filter(u => u.role === "manager").length}
            </div>
            <div style={{ color: "#666", marginTop: "8px" }}>🔑 友校管理員</div>
          </div>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#9C27B0" }}>
              {users.filter(u => u.role === "user" || !u.role).length}
            </div>
            <div style={{ color: "#666", marginTop: "8px" }}>👤 一般用戶</div>
          </div>
        </div>

        {/* 搜尋和篩選 */}
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "20px"
        }}>
          <div style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap"
          }}>
            <input
              type="text"
              placeholder="搜尋使用者 (Email 或姓名)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: "250px",
                padding: "12px 16px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem"
              }}
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              <option value="all">全部角色</option>
              <option value="admin">👑 管理員</option>
              <option value="manager">🔑 友校管理員</option>
              <option value="user">👤 一般用戶</option>
            </select>
          </div>
        </div>

        {/* 使用者列表 */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "auto"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "1000px"
          }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                <th style={{ padding: "16px", textAlign: "left", fontWeight: "bold" }}>Email</th>
                <th style={{ padding: "16px", textAlign: "left", fontWeight: "bold" }}>姓名</th>
                <th style={{ padding: "16px", textAlign: "center", fontWeight: "bold" }}>角色</th>
                <th style={{ padding: "16px", textAlign: "center", fontWeight: "bold" }}>學校</th>
                <th style={{ padding: "16px", textAlign: "center", fontWeight: "bold" }}>資料更新</th>
                <th style={{ padding: "16px", textAlign: "center", fontWeight: "bold" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const roleInfo = getRoleInfo(user.role);
                return (
                  <tr 
                    key={user.id}
                    style={{
                      borderBottom: "1px solid #eee",
                      background: index % 2 === 0 ? "white" : "#fafafa",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f0f0f0"}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? "white" : "#fafafa"}
                  >
                    <td style={{ padding: "16px", fontSize: "0.9rem" }}>
                      {user.email}
                      {user.id === currentUser.uid && (
                        <span style={{ 
                          marginLeft: "8px", 
                          fontSize: "0.75rem", 
                          color: "#2196F3",
                          fontWeight: "bold"
                        }}>
                          (您)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>{user.name || user.displayName || "未設定"}</td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        color: roleInfo.color,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        {roleInfo.icon} {roleInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span style={{
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        color: roleInfo.color,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        {user.school}
                      </span>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
                      {user.updatedAt?.toDate 
                        ? user.updatedAt.toDate().toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "未知"}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <button
                        onClick={() => openUserModal(user)}
                        style={{
                          padding: "8px 16px",
                          background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          fontWeight: "bold"
                        }}
                      >
                        管理
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#999"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
              <div>找不到符合條件的使用者</div>
            </div>
          )}
        </div>
      </div>

      {/* 使用者詳情彈窗 */}
      {showModal && selectedUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "500px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto"
          }}>
            <h2 style={{ marginTop: 0, marginBottom: "24px" }}>使用者管理</h2>
            
            <div style={{ marginBottom: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <strong>Email:</strong> {selectedUser.email}
                {selectedUser.id === currentUser.uid && (
                  <span style={{ 
                    marginLeft: "8px", 
                    color: "#2196F3",
                    fontWeight: "bold"
                  }}>
                    (您的帳號)
                  </span>
                )}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>姓名：</strong> {selectedUser.name || selectedUser.displayName || "未設定"}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>班級座號：</strong> {selectedUser.classandnumber || "未設定"}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>電話：</strong> {selectedUser.phone || "未設定"}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>資料更新：</strong> {selectedUser.updatedAt?.toDate 
                  ? selectedUser.updatedAt.toDate().toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : "未知"}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>身分：</strong> {getRoleInfo(selectedUser.role).icon} {getRoleInfo(selectedUser.role).label}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>使用者 ID：</strong> <span style={{ fontSize: "0.85rem", color: "#666" }}>{selectedUser.id}</span>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>學校：</strong> {selectedUser.school || "未設定"}
              </div>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {/* 設為管理員 */}
              <button
                onClick={() => changeUserRole(selectedUser.id, "admin")}
                disabled={selectedUser.role === "admin"}
                style={{
                  padding: "12px",
                  background: selectedUser.role === "admin" ? "#ccc" : "#2196F3",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: selectedUser.role === "admin" ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  opacity: selectedUser.role === "admin" ? 0.5 : 1
                }}
              >
                👑 {selectedUser.role === "admin" ? "已是管理員" : "設為管理員"}
              </button>

              {/* 設為友校管理員 */}
              <button
                onClick={() => changeUserRole(selectedUser.id, "manager")}
                disabled={selectedUser.role === "manager" || (selectedUser.id === currentUser.uid && selectedUser.role === "admin")}
                style={{
                  padding: "12px",
                  background: selectedUser.role === "manager" ? "#ccc" : "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: (selectedUser.role === "manager" || (selectedUser.id === currentUser.uid && selectedUser.role === "admin")) ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  opacity: (selectedUser.role === "manager" || (selectedUser.id === currentUser.uid && selectedUser.role === "admin")) ? 0.5 : 1
                }}
              >
                🔑 {selectedUser.role === "manager" ? "已是友校管理員" : "設為友校管理員"}
              </button>

              {/* 設為一般用戶 */}
              <button
                onClick={() => changeUserRole(selectedUser.id, "user")}
                disabled={selectedUser.role === "user" || (selectedUser.id === currentUser.uid && selectedUser.role === "admin")}
                style={{
                  padding: "12px",
                  background: selectedUser.role === "user" ? "#ccc" : "#9C27B0",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: (selectedUser.role === "user" || (selectedUser.id === currentUser.uid && selectedUser.role === "admin")) ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  opacity: (selectedUser.role === "user" || (selectedUser.id === currentUser.uid && selectedUser.role === "admin")) ? 0.5 : 1
                }}
              >
                👤 {selectedUser.role === "user" ? "已是一般用戶" : "設為一般用戶"}
              </button>

              {/* 刪除使用者 */}
              <button
                onClick={() => deleteUser(selectedUser.id)}
                disabled={selectedUser.id === currentUser.uid || selectedUser.role === "admin"}
                style={{
                  padding: "12px",
                  background: "#d32f2f",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: (selectedUser.id === currentUser.uid || selectedUser.role === "admin") ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  opacity: (selectedUser.id === currentUser.uid || selectedUser.role === "admin") ? 0.5 : 1
                }}
              >
                🗑️ 刪除使用者
              </button>

              {/* 取消按鈕 */}
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
                style={{
                  padding: "12px",
                  background: "#fff",
                  color: "#333",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}