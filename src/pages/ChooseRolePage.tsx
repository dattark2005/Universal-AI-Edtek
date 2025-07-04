import React from "react";
import { useNavigate } from "react-router-dom";
import RoleSelection from "../components/Auth/RoleSelection";
import { getCurrentUser, setCurrentUser } from "../utils/storage";
import { authAPI } from "../services/api";

const ChooseRolePage = ({ setUser }: { setUser: any }) => {
  const navigate = useNavigate();
  return (
    <RoleSelection
      onRoleSelected={async (role) => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        await authAPI.setPasswordOrRole({
          email: currentUser.email,
          name: currentUser.name,
          role,
          password: undefined,
        });
        const updatedUser = { ...currentUser, role };
        setCurrentUser(updatedUser);
        setUser(updatedUser);
        navigate("/set-password");
      }}
    />
  );
};

export default ChooseRolePage; 