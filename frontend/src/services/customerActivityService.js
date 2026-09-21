
import api from "./api";

export const getCustomerActivity = async (
  page = 1,
  limit = 10
) => {
  const response = await api.get(
    `/customer/activity?page=${page}&limit=${limit}`
  );

  return response.data;
};

