import api from "./api";

export const getCustomerTransactions = async (page = 1, limit = 10) => {
  const response = await api.get(
    `/customer/transactions?page=${page}&limit=${limit}`
  );

  return response.data;
};

export const getCustomerTransactionDetails = async (transactionId) => {
  const response = await api.get(
    `/customer/transactions/${transactionId}`
  );

  return response.data;
};