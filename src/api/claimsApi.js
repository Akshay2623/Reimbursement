import apiClient from "./apiClient";

export const reimbursementApi = {
  getMyClaims: ({ employeeUserID, statusID }) =>
    apiClient.get("/getmyclaims", {
      params: { employeeUserID, statusID },
    }),

  getClaimDetails: (reimbursementClaimID) =>
    apiClient.get("/getclaimdetails", {
      params: { reimbursementClaimID },
    }),

  getPendingApprovals: (approverUserID) =>
    apiClient.get("/getpendingapprovals", {
      params: { approverUserID },
    }),

  getApprovalDashboardCount: (approverUserID) =>
    apiClient.get("/getapprovaldashboardcount", {
      params: { approverUserID },
    }),

  createClaim: (payload) => apiClient.post("/createclaim", payload),
  addClaimItem: (payload) => apiClient.post("/addclaimitem", payload),
  addAttachment: (payload) => apiClient.post("/addattachment", payload),
  submitClaim: (payload) => apiClient.post("/submitclaim", payload),
  approveManager: (payload) => apiClient.post("/approvemanager", payload),
  approveSpecialApprover: (payload) =>
    apiClient.post("/approvespecialapprover", payload),
  approveHr: (payload) => apiClient.post("/approvehr", payload),
  approveFinance: (payload) => apiClient.post("/approvefinance", payload),
  rejectClaim: (payload) => apiClient.post("/rejectclaim", payload),
  sendBackClaim: (payload) => apiClient.post("/sendbackclaim", payload),
  markPaid: (payload) => apiClient.post("/markpaid", payload),
};

export default reimbursementApi;