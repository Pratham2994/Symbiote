import { createContext, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Dummy authentication; replace with real logic later
  const user = { name: "Dummy User", role: "user" };

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
