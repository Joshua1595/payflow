import api from "./api";

export const getMerchantTransactions = async () => {
  const response = await api.get("/merchant/transactions");

  return response.data;
};

export const getMerchantTransactionDetails = async (transactionId) => {
  const response = await api.get(
    `/merchant/transactions/${transactionId}`
  );

  return response.data;
};