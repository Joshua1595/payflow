import api from "./api";

export const getMerchantActivity = async (limit = 20) => {
  const response = await api.get("/merchant/activity", {
    params: {
      limit,
    },
  });

  return response.data;
};

