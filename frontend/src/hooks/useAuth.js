import { useContext } from "react";
import { AuthContext } from "../context/auth-context";

/**
 * Hook to access the AuthContext.
 * Must be used inside an AuthProvider — throws otherwise.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
