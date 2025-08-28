import React, { createContext, useState, useContext, useEffect } from "react";
import { auth, db } from "../firebase.js";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [user] = useAuthState(auth);
  const [hasLoaded, setHasLoaded] = useState(false); // ✅ 防止覆蓋

  // 讀取 Firestore 購物車
  useEffect(() => {
    const loadCart = async () => {
      if (!user || !user.uid) {
        setCartItems([]);
        setHasLoaded(false);
        return;
      }

      const cartRef = doc(db, "carts", user.uid);
      const snap = await getDoc(cartRef);

      if (snap.exists()) {
        setCartItems(snap.data().items || []);
      } else {
        setCartItems([]);
      }

      setHasLoaded(true); // ✅ 表示讀完了
    };

    loadCart();
  }, [user]);

  // 存 Firestore（但只在讀取完成後才存）
  useEffect(() => {
    if (!user || !user.uid || !hasLoaded) return;

    const cartRef = doc(db, "carts", user.uid);
    const saveCart = async () => {
      await setDoc(cartRef, { items: cartItems });
    };

    saveCart();
  }, [cartItems, user, hasLoaded]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, amount) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(item.quantity + amount, 0) } : item
      )
    );
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, setCartItems }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
