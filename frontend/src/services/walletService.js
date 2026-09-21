
import api from "./api";

export const getWallet = async () => {
  const response = await api.get("/wallet");
  return response.data;
};

export const depositMoney = async (amount) => {
  const response = await api.post("/wallet/deposit", {
    amount,
  });

  return response.data;
};

export const withdrawMoney = async (amount) => {
  const response = await api.post("/wallet/withdraw", {
    amount,
  });

  return response.data;
};

export const getLedger = async () => {
  const response = await api.get("/wallet/ledger");
  return response.data;
};

export const verifyLedger = async () => {
  const response = await api.get("/wallet/ledger/verify");
  return response.data;
};

