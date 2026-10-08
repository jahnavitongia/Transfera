import { useEffect, useState } from "react";
import { get } from "../services/api";
import { AuthContext } from "./AuthContext";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const expire = () => { setUser(null); setError(""); };
    window.addEventListener("auth:expired", expire);
    const load = async () => {
      try {
        if (localStorage.getItem("transferaToken")) {
          const response = await get("/auth/me");
          if (active) setUser(response.data.user);
        }
      } catch (requestError) {
        if (active && requestError.response?.status !== 401) setError("Cannot reach the server. Restart the demo and refresh.");
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; window.removeEventListener("auth:expired", expire); };
  }, []);
  const signIn = (response) => {
    localStorage.setItem("transferaToken", response.token);
    setUser(response.user); setError("");
  };
  const signOut = () => { localStorage.removeItem("transferaToken"); setUser(null); setError(""); };
  return <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>{children}</AuthContext.Provider>;
}
