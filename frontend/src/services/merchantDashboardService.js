
import api from "./api";

export const getMerchantDashboard = async () => {
  const response = await api.get("/merchant-dashboard");

  return response.data;
};

