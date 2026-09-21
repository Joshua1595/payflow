
import api from "./api";

export const getCustomerTransfers = async (page = 1, limit = 10) => {
  const response = await api.get(
    `/customer/transfers?page=${page}&limit=${limit}`
  );

  return response.data;
};

export const sendMoney = async (receiverEmail, amount) => {
  const response = await api.post("/customer/transfers", {
    receiverEmail,
    amount,
  });

  return response.data;
};

export const getCustomerTransferDetails = async (transferId) => {
  const response = await api.get(
    `/customer/transfers/${transferId}`
  );

  return response.data;
};
export const findReceiver = async (email) => {
  const response = await api.get(
    `/customer/transfers/receiver?email=${encodeURIComponent(email)}`
  );

  return response.data;
};

