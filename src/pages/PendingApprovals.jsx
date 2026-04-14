import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import Alert from "../components/Alert";
import { reimbursementApi } from "../api/reimbursementApi";
import ApprovalActionPanel from "../components/ApprovalActionPanel";
import {
  DEFAULT_HR_USER_ID,
  FINANCE_USER_ID,
  SPECIAL_APPROVER_ID,
} from "../config/reimbursementWorkflow";
import { currentUser } from "../lib/currentUser";

const PendingApprovals = () => {
  const approverUserId = Number(currentUser.userId);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const queueLabel = useMemo(() => {
    if (approverUserId === SPECIAL_APPROVER_ID) return "Special Approval Queue";
    if (approverUserId === FINANCE_USER_ID) return "Finance Queue";
    if (approverUserId === DEFAULT_HR_USER_ID) return "HR Queue";
    return "Manager Queue";
  }, [approverUserId]);

  const resolveApproverRole = (approval) =>
    approval?.ApproverRole ||
    approval?.ApproverRoleName ||
    approval?.CurrentApproverRole ||
    approval?.PendingWithRole ||
    approval?.ApproverRoleLabel ||
    queueLabel;

  const normalizeApproval = (approval) => {
    if (!approval) return approval;
    if (typeof approval === "object" && !Array.isArray(approval)) {
      return {
        ...approval,
        ReimbursementClaimID:
          approval.ReimbursementClaimID ??
          approval.reimbursementClaimID ??
          approval.reimbursementClaimId ??
          approval.claimId ??
          approval.claimID ??
          approval.id ??
          approval.ID,
        ClaimNo: approval.ClaimNo ?? approval.claimNo ?? approval.claimNumber,
        ClaimDate: approval.ClaimDate ?? approval.claimDate ?? approval.submittedOn,
        EmployeeName:
          approval.EmployeeName ?? approval.employeeName ?? approval.employeeFullName,
        TotalAmount: approval.TotalAmount ?? approval.totalAmount ?? approval.amount,
        Purpose: approval.Purpose ?? approval.purpose ?? approval.title,
        CurrentStatusName:
          approval.CurrentStatusName ?? approval.currentStatusName,
        ActionType: approval.ActionType ?? approval.actionType ?? approval.Action ?? approval.action,
        ApproverRole:
          approval.ApproverRole ??
          approval.approverRole ??
          approval.CurrentApproverRole ??
          approval.currentApproverRole,
        CurrentApproverID:
          approval.CurrentApproverID ??
          approval.currentApproverID ??
          approval.currentApproverId,
        CurrentLevel:
          approval.CurrentLevel ??
          approval.currentLevel ??
          approval.currentLevelNo ??
          approval.currentlevelno ??
          approval.LevelNo ??
          approval.levelNo ??
          approval.level,
      };
    }
    const hasNumericKeys =
      typeof approval === "object" && !Array.isArray(approval) && "0" in approval;
    const arr = Array.isArray(approval)
      ? approval
      : hasNumericKeys
        ? Object.keys(approval)
            .filter((key) => String(Number(key)) === key)
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => approval[key])
        : null;

    if (arr) {
      return {
        ReimbursementClaimID: arr[0],
        ClaimNo: arr[1],
        ClaimDate: arr[2],
        TotalAmount: arr[3],
        Purpose: arr[4] || arr[5],
        CurrentStatusName: arr[7] || arr[12],
        EmployeeName: arr[10],
        ApproverRole: arr[11],
        ActionType: arr[13],
        raw: approval,
      };
    }

    return approval;
  };

  const getCachedBill = (claimId) => {
    if (!claimId) return null;
    const prefix = `reimb-attachment:${claimId}:`;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const dataUrl = localStorage.getItem(key);
        if (dataUrl) {
          return { key, dataUrl };
        }
      }
    }
    return null;
  };

  const handleFetchApprovals = async () => {
    if (!approverUserId) {
      setError("Invalid Approver User ID");
      setApprovals([]);
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await reimbursementApi.getPendingApprovals(approverUserId);
      const payload = data?.Data ?? data?.data ?? data ?? [];
      const approvalsList =
        (Array.isArray(payload) && payload) ||
        payload?.Approvals ||
        payload?.approvals ||
        payload?.PendingApprovals ||
        [];
      setApprovals(Array.isArray(approvalsList) ? approvalsList : []);
    } catch (err) {
      setError(err.message || "Failed to load pending approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approverUserId]);

  return (
    <div className="space-y-6">
      <PageHeader title="Pending Approvals" subtitle={queueLabel} />

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Viewing As
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {currentUser.fullName || "Current User"}
          </p>
          <p className="text-xs text-slate-500">Approver ID: {approverUserId}</p>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleFetchApprovals}
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh Queue"}
          </button>
        </div>
      </section>

      <Alert tone="error" message={error} />
      <Alert tone="success" message={success} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">Claim No</th>
              <th className="px-4 py-3">Claim Date</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Approver Role</th>
              <th className="px-4 py-3">Bill</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan="9">
                  Loading approvals...
                </td>
              </tr>
            ) : approvals.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan="9">
                  No pending approvals in this queue.
                </td>
              </tr>
            ) : (
              approvals.map((approval) => {
                const row = normalizeApproval(approval);
                const cachedBill = getCachedBill(row?.ReimbursementClaimID);
                const isFinanceRow =
                  String(resolveApproverRole(row) || "").toLowerCase().includes("finance") ||
                  String(row?.ActionType || "").trim() === "SendPayment";
                const statusLabel =
                  isFinanceRow &&
                  String(row?.CurrentStatusName || "").trim() === "Pending Approval"
                    ? "Ready for Payment"
                    : row?.CurrentStatusName || row?.Status || "-";
                return (
                <tr key={row?.ReimbursementClaimID || row?.ClaimNo || Math.random()}>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {row?.ClaimNo || row?.ClaimNumber || "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {row?.ClaimDate || row?.SubmittedOn || "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {row?.EmployeeName || row?.Employee || row?.EmployeeFullName || "-"}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {row?.TotalAmount ?? row?.Amount ?? "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {row?.Purpose || row?.Title || "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {statusLabel}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {resolveApproverRole(row)}
                  </td>
                  <td className="px-4 py-4">
                    {cachedBill?.dataUrl ? (
                      <a
                        href={cachedBill.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-brand-600"
                      >
                        <img
                          src={cachedBill.dataUrl}
                          alt="Bill"
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        Open Bill
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No bill</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <ApprovalActionPanel
                      claim={row}
                      currentUser={currentUser}
                      onSuccess={() => {
                        setSuccess("Action completed.");
                        handleFetchApprovals();
                      }}
                    />
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovals;
