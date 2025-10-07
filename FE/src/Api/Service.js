import {
  deleteApi,
  getApi,
  postApi,
  putApi,
  patchApi,
  postFormApi,
  patchFormApi,getBlobApi
} from "./axiosService";

export const registerApi = (data) => {
  return postApi("adminUserRegistration", data);
};
export const registerSubAdminApi = (data) => {
  return postApi("registerSubAdmin", data);
};
export const addUserByEmailApi = (data) => {
  return postApi("addUserByEmail", data);
};
export const exportExcelApi = () => {
  return getApi("exportExcel");
};
export const loginApi = (data) => {
  return postApi("login", data);
};
export const userCryptoCardApi = (data) => {
  return postApi("userCryptoCard", data);
};
export const logoutApi = (data) => {
  return getApi("logout", data);
};

export const allUsersApi = (data) => {
  return getApi("allUser", data);
};
export const getCoinsUserApi = (id) => {
  return getApi(`getCoinsUser/${id}`);
};
export const signleUsersApi = (id) => {
  return getApi(`singleUser/${id}`);
};
export const getNotificationsApi = () => {
  return getApi(`getNotifications`);
};
export const deleteTransactionApi = (userId, id) => {
  return getApi(`deleteTransaction/${userId}/${id}`);
};
export const getHtmlDataApi = () => {
  return getApi(`getHtmlData`);
};
export const setHtmlDataApi = (data) => {
  return patchApi(`setHtmlData`, data);
};
export const updateSignleUsersApi = (id, data) => {
  return postApi(`updateSingleUser/${id}`, data);
};
export const applyCreditCardApi = (data) => {
  return postApi(`applyCreditCard`, data);
};
export const updateOldUserCoins = () => {
  return patchApi(`updateCoins`);
};
export const updateSignleUsersStatusApi = (id, data) => {
  return postApi(`updateSingleUserStatus/${id}`, data);
};
export const sendEmailCodeApi = (data) => {
  return postApi(`sendEmail`, data);
};
export const bypassSingleUserApi = (id) => {
  return patchApi(`bypassSingleUser/${id}`);
};
export const getCoinsApi = (id) => {
  return getApi(`getCoins/${id}`);
};

export const patchCoinsApi = (id) => {
  return patchApi(`addCoins/${id}`);
};
export const updateCoinAddressApi = (id, data) => {
  return patchApi(`updateCoinAddress/${id}`, data);
};
export const updateNewCoinAddressApi = (id, data) => {
  return patchApi(`updateNewCoinAddress/${id}`, data);
};
export const createTransactionApi = (id, data) => {
  return patchApi(`createTransaction/${id}`, data);
};
export const createUserStocksApi = (id, data) => {
  return postApi(`createUserStocks/${id}`, data);
};
export const createUserTransactionApi = (id, data) => {
  return patchApi(`/createUserTransaction/${id}`, data);
};
export const createUserTransactionWithdrawSwapApi = (id, data) => {
  return patchApi(`/createUserTransactionWithdrawSwap/${id}`, data);
};
export const markTrxCloseApi = (id, Coinid) => {
  return patchApi(`/markTrxClose/${id}/${Coinid}`);
};
export const createUserTransactionDepositSwapApi = (id, data) => {
  return patchApi(`/createUserTransactionDepositSwap/${id}`, data);
};

export const updateTransactionApi = (id, data) => {
  return patchApi(`updateTransaction/${id}`, data);
};
export const getTransactionsApi = () => {
  return getApi(`getTransactions`);
};
export const getEachUserApi = (id, data) => {
  return getApi(`getEachUser/${id}`, data);
};
export const getUserCoinApi = (id, data) => {
  return getApi(`getUserCoin/${id}`, data);
};
export const updateNotificationStatusApi = (id, status) => {
  return getApi(`updateNotificationStatus/${id}/${status}`);
};
export const verifySingleUserApi = (data) => {
  return patchFormApi(`verifySingleUser`, data);
};
export const getsignUserApi = (data) => {
  return patchApi(`getsignUser`, data);
};
export const verifyEmailApi = (data) => {
  return getApi(`${data.id}/verify/${data.token}`, data);
};
export const deleteEachUserApi = (id) => {
  return deleteApi(`deleteEachUser/${id}`, id);
};
export const UnassignUserApi = (id) => {
  return deleteApi(`UnassignUser/${id}`);
};
export const deleteUserStocksApi = (coindId, id) => {
  return deleteApi(`deleteUserStocksApi/${id}/${coindId}`, id, coindId);
};
export const deleteUserTokensApi = (coindId, id) => {
  return deleteApi(`deleteUserTokens/${id}/${coindId}`, id, coindId);
};
export const updateKycApi = (id, data) => {
  return patchApi(`updateKyc/${id}`, data);
};
export const sendTicketApi = (data) => {
  return postApi(`sendTicket`, data);
};
export const uploadFilesApi = (id, data) => {
  return postFormApi(`uploadFiles/${id}`, data);
};
export const getAllDataApi = (id) => {
  return getApi(`getAllData/${id}`);
};
export const deleteSingleFileApi = (_id) => {
  return getApi(`deleteSingleFile/${_id}`);
};
export const PaymentsApi = (id, data) => {
  return patchApi(`createAccount/${id}`, data);
};

export const addCardApi = (id, data) => {
  return patchApi(`addCard/${id}`, data);
};
export const deletePaymentApi = (id, pId) => {
  return getApi(`deletePayment/${id}/${pId}`);
};
export const createTicketApi = (data) => {
  return postApi(`createTicket`, data);
};
export const getUserTicketsApi = (id) => {
  return getApi(`getUserTickets/${id}`);
};
export const getIndivTicketApi = (id, ticketId) => {
  return getApi(`getIndivTicket/${id}/${ticketId}`);
};
export const adminTicketsApi = () => {
  return getApi(`admin/tickets`);
};
export const updateMessageApi = (ticketData) => {
  return patchApi(`updateMessage`, ticketData);
};
export const getStocksApi = () => {
  return getApi(`stocks`);
};
export const addNewStockApi = (data) => {
  return postApi(`addNewStock`, data);
};
export const updateStockApi = (stockId, stockData) => {
  return patchApi(`stocks/${stockId}`, stockData);
};
export const updateTokenApi = (tokenId, tokenData) => {
  return patchApi(`tokens/${tokenId}`, tokenData);
};
export const deleteStockApi = (stockId) => {
  return deleteApi(`stocks/${stockId}`);
};
export const getLinksApi = () => {
  return getApi(`getLinks`);
};
export const updateLinksApi = (id, enabled) => {
  return putApi(`updateLinks/${id}/${enabled}`, enabled);
};
export const deleteTicketApi = (id) => {
  return deleteApi(`deleteTicket/${id}`,);
};
export const getStakingSettingsApi = (id) => {
  return getApi(`getStakingSettings/${id}`,);
};
export const updateStakingSettingsApi = (id, settings) => {
  return patchApi(`updateStakingSettings/${id}`, settings);
};
export const deleteAllNotificationsApi = () => {
  return deleteApi(`deleteAllNotifications`);
};
export const deleteNotificationApi = (id) => {
  return deleteApi(`deleteNotification/${id}`);
};
export const getStakingRewardsApi = (id) => {
  return getApi(`getStakingRewards/${id}/stakings`);
};
export const addMyTokensApi = (userId, data) => {
  return patchFormApi(`/addMyTokens/${userId}`, data);
};
export const getAllTokensApi = (id) => {
  return getApi(`/getAllTokens/${id}`);
};
export const getMyTokensApi = (id) => {
  return getApi(`/tokens/${id}`);
};
export const getRestrictionsApi = () => {
  return getApi(`/restrictions`);
};
export const UpdateRestrictionsApi = (data) => {
  return patchApi(`/restrictionsUpdate`, data);
};
export const UpdateSubAdminPermissionsApi = (id, body) => {
  return patchApi(`/users/${id}/permissions`, body);
};
export const UpdateAdminPermissionsApi = (id, body) => {
  return patchApi(`/admin/${id}/permissions`, body);
};

// ✅ Correct API functions
export const getErrorLogsApi = (page = 1) => {
  return getApi(`/getErrorLogs?page=${page}`);
};

// api service
export const deleteErrorLogsApi = (ids = []) => {
  const query = ids.length ? `?ids=${ids.join(",")}` : "";
  return deleteApi(`/deleteErrorLogs${query}`);
};
// CRM ROUTES/////////////////////////////////////////////////////
export const adminCrmLoginApi = (body) => {
  return postApi(`/crm/login`, body);
};
export const adminCrmLeadsApi = ({ params }) => {
  const queryString = new URLSearchParams(params).toString();
  return getApi(`/crm/getLeads?${queryString}`);
};
export const createLeadApi = (leadData) => {
  return postApi(`/crm/createLead`, leadData);
};
export const uploadLeadsCsvApi = (formData) => {
  return postFormApi(`/crm/uploadLeads`, formData);
};
export const deleteLeadApi = (leadId) => {
  return deleteApi(`/crm/deleteLead/${leadId}`);
};
export const deleteLeadsBulkApi = (leadIds) => {
  return postApi(`/crm/bulkDeleteLeads`, { leadIds });
};
export const deleteAllLeadsApi = () => {
  return deleteApi(`/crm/deleteAllLeads`);
};
export const updateLeadApi = (leadId, leadData) => {
  return patchApi(`/crm/editLead/${leadId}`, leadData);
};
export const exportLeadsApi = (filters = {}) => {
  return getBlobApi(`/exportLeads`,filters);
};
export const assignLeadsApi = (leadIds, agentId) => {
  return postApi(`/crm/assignLeads`, { leadIds, agentId });
};