import api from "./api";

export const getMerchantSettlements = async (
  page = 1,
  limit = 10,
  status = ""
) => {
  const response = await api.get("/merchant/settlements", {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
  });

  return response.data;
};

export const getMerchantSettlementDetails = async (
  settlementId
) => {
  const response = await api.get(
    `/merchant/settlements/${settlementId}`
  );

  return response.data;
};

export const getSettlementReconciliation = async () => {
  const response = await api.get(
    "/merchant/settlements/reconciliation"
  );

  return response.data;
};

