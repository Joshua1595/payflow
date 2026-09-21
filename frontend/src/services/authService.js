import api from "./api";
import { saveToken } from "../utils/storage";

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);

  console.log("LOGIN API RESPONSE:", response.data);

  if (response.data.token) {
    saveToken(response.data.token);
  }

  return response.data;
};

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);

  return response.data;
};