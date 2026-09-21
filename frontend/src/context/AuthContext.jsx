import { createContext, useContext, useState } from "react";
import {
  saveToken,
  getToken,
  removeToken,
} from "../utils/storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("payflow_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return getToken();
  });

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);

    saveToken(accessToken);

    localStorage.setItem(
      "payflow_user",
      JSON.stringify(userData)
    );
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    removeToken();
    localStorage.removeItem("payflow_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}