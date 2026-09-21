
import api from "./api";

export const getMerchantPayments = async (
  page = 1,
  limit = 10,
  status = ""
) => {
  const response = await api.get("/merchant/payments", {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
  });

  return response.data;
};

export const getMerchantPaymentDetails = async (paymentId) => {
  const response = await api.get(
    `/merchant/payments/${paymentId}`
  );

  return response.data;
};

