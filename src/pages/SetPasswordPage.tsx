import React from "react";
import { useNavigate } from "react-router-dom";
import SetPassword from "../components/Auth/SetPassword";
import { getCurrentUser, setCurrentUser } from "../utils/storage";
import { authAPI } from "../services/api";

const SetPasswordPage = ({ setUser }: { setUser: any }) => {
  const navigate = useNavigate();
  return (
    <SetPassword
      onPasswordSet={async (password) => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        await authAPI.setPasswordOrRole({
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role as 'student' | 'teacher',
          password,
        });
        setCurrentUser(currentUser);
        setUser(currentUser);
        navigate("/dashboard");
      }}
    />
  );
};

export default SetPasswordPage; 