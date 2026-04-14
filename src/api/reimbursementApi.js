import apiClient from "./apiClient";

const withNumber = (value) =>
  value === "" || value === null || value === undefined ? undefined : Number(value);

export const reimbursementApi = {
  getMyClaims: ({ employeeUserID, statusID }) =>
    apiClient.get("/master/getmyclaims", {
      params: {
        employeeUserID: withNumber(employeeUserID),
        statusID: statusID === undefined ? undefined : withNumber(statusID),
      },
    }),
  getClaimDetails: (reimbursementClaimID) =>
    apiClient.get("/master/getclaimdetails", {
      params: { reimbursementClaimID: withNumber(reimbursementClaimID) },
    }),
  getPendingApprovals: (approverUserID) =>
    apiClient.get("/master/getpendingapprovals", {
      params: { approverUserID: withNumber(approverUserID) },
    }),
  getApprovalDashboardCount: (approverUserID) =>
    apiClient.get("/master/getapprovaldashboardcount", {
      params: { approverUserID: withNumber(approverUserID) },
    }),
  getUserMaster: () => apiClient.get("/master/getusermaster"),
  getDepartmentMaster: () => apiClient.get("/master/getdepartmentmaster"),
  createClaim: (payload) => apiClient.post("/master/createclaim", payload),
  addClaimItem: (payload) => apiClient.post("/master/addclaimitem", payload),
  addAttachment: (payload) => apiClient.post("/master/addattachment", payload),
  submitClaim: (payload) => apiClient.post("/master/submitclaim", payload),
  approveManager: (payload) => apiClient.post("/master/approvemanager", payload),
  approveSpecialApprover: (payload) =>
    apiClient.post("/master/approvespecialapprover", payload),
  approveFinance: (payload) => apiClient.post("/master/approvefinance", payload),
  approveHr: (payload) => apiClient.post("/master/approvehr", payload),
  rejectClaim: (payload) => apiClient.post("/master/rejectclaim", payload),
  sendBackClaim: (payload) => apiClient.post("/master/sendbackclaim", payload),
  sendPayment: (payload) => apiClient.post("/master/approvefinance", payload),
  markPaid: (payload) => apiClient.post("/master/markpaid", payload),
};

export default reimbursementApi;
