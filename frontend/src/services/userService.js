import api from "./api";

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};