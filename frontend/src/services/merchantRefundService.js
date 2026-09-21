import api from "./api";
export const getMerchantRefunds = async (
  page = 1,
  limit = 10,
  status = ""
) => {
  const response = await api.get("/merchant/refunds", {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
  });

  return response.data;
};

export const getMerchantRefundDetails = async (refundId) => {
  const response = await api.get(
    `/merchant/refunds/${refundId}`
  );

  return response.data;
};

