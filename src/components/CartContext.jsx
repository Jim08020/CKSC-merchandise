import React, { createContext, useState, useContext, useEffect } from "react";
import { auth, db } from "../firebase.js";
import { doc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user || !user.uid) return; // 確保 user 有值再存
    const cartRef = doc(db, "carts", user.uid);
    const saveCart = async () => {
      await setDoc(cartRef, { items: cartItems });
    };
    saveCart();
  }, [cartItems, user]);

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
