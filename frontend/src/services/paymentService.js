
import api from "./api";

export const getCustomerPayments = async (
  page = 1,
  limit = 10,
  status = ""
) => {
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("limit", limit);

  if (status) {
    params.append("status", status);
  }

  const response = await api.get(
    `/customer/payments?${params.toString()}`
  );

  return response.data;
};

export const getCustomerPaymentDetails = async (paymentId) => {
  const response = await api.get(
    `/customer/payments/${paymentId}`
  );

  return response.data;
};

export const getActiveMerchants = async () => {
  const response = await api.get("/merchants");

  return response.data;
};

export const createPayment = async ({
  merchantId,
  amount,
  currency = "ETB",
}) => {
  const response = await api.post("/payments", {
    merchantId,
    amount,
    currency,
  });

  return response.data;
};

export const processPayment = async (
  paymentId,
  idempotencyKey
) => {
  const response = await api.post(
    `/payments/${paymentId}/process`,
    {},
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );

  return response.data;
};

export const getCustomerRefunds = async (
  page = 1,
  limit = 10,
  status = ""
) => {
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("limit", limit);

  if (status) {
    params.append("status", status);
  }

  const response = await api.get(
    `/customer/refunds?${params.toString()}`
  );

  return response.data;
};

export const getCustomerRefundDetails = async (refundId) => {
  const response = await api.get(
    `/customer/refunds/${refundId}`
  );

  return response.data;
};


