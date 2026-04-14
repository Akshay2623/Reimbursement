import { useState } from "react";
import { reimbursementApi } from "../api/reimbursementApi";

const toNumber = (value) =>
  value === "" || value === null || value === undefined ? undefined : Number(value);

const toIsoDate = (value) => (value ? new Date(value).toISOString() : undefined);

const withDevLog = (label, payload) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[${label}] payload`, payload);
  }
};

export const useReimbursementActions = () => {
  const [loading, setLoading] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const runAction = async (key, action, payload) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    setError("");
    setSuccess("");
    try {
      withDevLog(key, payload);
      const response = await action(payload);
      setSuccess("Action completed successfully.");
      return response?.data;
    } catch (err) {
      setError(err.message || "Action failed.");
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return {
    loading,
    error,
    success,
    setError,
    setSuccess,
    createClaim: (payload) =>
      runAction("createClaim", reimbursementApi.createClaim, {
        employeeUserID: toNumber(payload.employeeUserID),
        departmentID: toNumber(payload.departmentID),
        financeUserID: toNumber(payload.financeUserID),
        claimDate: toIsoDate(payload.claimDate),
        totalAmount: toNumber(payload.totalAmount),
        purpose: payload.purpose,
        remarks: payload.remarks,
        createdBy: toNumber(payload.createdBy),
        reimbursementClaimTypeID: toNumber(payload.reimbursementClaimTypeID),
      }),
    addClaimItem: (payload) =>
      runAction("addClaimItem", reimbursementApi.addClaimItem, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        expenseDate: toIsoDate(payload.expenseDate),
        expenseType: payload.expenseType,
        amount: toNumber(payload.amount),
        description: payload.description,
        billNo: payload.billNo,
      }),
    addAttachment: (payload) =>
      runAction("addAttachment", reimbursementApi.addAttachment, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        fileName: payload.fileName,
        filePath: payload.filePath,
        fileType: payload.fileType,
        uploadedBy: toNumber(payload.uploadedBy),
      }),
    submitClaim: (payload) =>
      runAction("submitClaim", reimbursementApi.submitClaim, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        submittedBy: toNumber(payload.submittedBy),
      }),
    approveManager: (payload) =>
      runAction("approveManager", reimbursementApi.approveManager, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        managerUserID: toNumber(payload.managerUserID),
        remarks: payload.remarks,
      }),
    approveSpecialApprover: (payload) =>
      runAction("approveSpecialApprover", reimbursementApi.approveSpecialApprover, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        specialApproverUserID: toNumber(payload.specialApproverUserID),
        remarks: payload.remarks,
      }),
    approveFinance: (payload) =>
      runAction("approveFinance", reimbursementApi.approveFinance, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        financeUserID: toNumber(payload.financeUserID),
        transactionID: payload.transactionID ?? payload.transactionId,
        remarks: payload.remarks,
      }),
    approveHR: (payload) =>
      runAction("approveHR", reimbursementApi.approveHr, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        hrUserID: toNumber(payload.hrUserID),
        remarks: payload.remarks,
      }),
    rejectClaim: (payload) =>
      runAction("rejectClaim", reimbursementApi.rejectClaim, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        actionBy: toNumber(payload.actionBy),
        remarks: payload.remarks,
      }),
    sendBackClaim: (payload) =>
      runAction("sendBackClaim", reimbursementApi.sendBackClaim, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        actionBy: toNumber(payload.actionBy),
        remarks: payload.remarks,
      }),
    markPaid: (payload) =>
      runAction("markPaid", reimbursementApi.markPaid, {
        reimbursementClaimID: toNumber(payload.reimbursementClaimID),
        actionBy: toNumber(payload.actionBy),
        remarks: payload.remarks,
      }),
  };
};
