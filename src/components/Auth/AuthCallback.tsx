import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setAuthToken, authAPI } from "../../services/api";

const AuthCallback = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      setAuthToken(token);
      authAPI
        .getCurrentUser()
        .then((res) => {
          localStorage.setItem("currentUser", JSON.stringify(res.data.user));
          onLogin(res.data.user);
          navigate("/dashboard");
        })
        .catch(() => {
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, [location, onLogin, navigate]);

  return <div className="text-white text-center mt-10">Logging you in...</div>;
};

export default AuthCallback;
