import { useEffect, useMemo, useState } from "react";
import { reimbursementApi } from "../api/reimbursementApi";
import { canMarkPaid, FINANCE_USER_ID, SPECIAL_APPROVER_ID, DEFAULT_HR_USER_ID } from "../config/reimbursementWorkflow";
import { currentUser as fallbackCurrentUser } from "../lib/currentUser";

const ApprovalActionPanel = ({
  claim,
  currentUser,
  onSuccess,
}) => {
  const [loading, setLoading] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  const claimIdRaw =
    claim?.ReimbursementClaimID ??
    claim?.reimbursementClaimID ??
    claim?.ReimbursementClaimId ??
    claim?.reimbursementClaimId ??
    claim?.ClaimID ??
    claim?.ClaimId ??
    claim?.claimId ??
    claim?.claimID ??
    claim?.id ??
    claim?.ID ??
    (Array.isArray(claim) ? claim[0] : null) ??
    null;
  const claimId = claimIdRaw ? Number(claimIdRaw) : null;
  const activeUser = currentUser || fallbackCurrentUser;
  const currentUserId = Number(activeUser?.userId);

  const isFinance = currentUserId === Number(FINANCE_USER_ID);
  const isHr = currentUserId === Number(DEFAULT_HR_USER_ID);
  const isSpecialApprover = currentUserId === Number(SPECIAL_APPROVER_ID);

  const canPaid = useMemo(() => canMarkPaid(claim, currentUserId), [claim, currentUserId]);
  const actionType =
    claim?.ActionType ??
    claim?.actionType ??
    claim?.Action ??
    claim?.action ??
    "";
  const normalizedActionType = String(actionType || "").trim();
  const isApproveReject = normalizedActionType === "ApproveReject";
  const isSendPayment = normalizedActionType === "SendPayment";
  const isViewOnly = normalizedActionType === "ViewOnly";
  const approverRoleRaw =
    claim?.ApproverRole ??
    claim?.approverRole ??
    claim?.CurrentApproverRole ??
    claim?.currentApproverRole ??
    claim?.ApproverRoleLabel ??
    "";
  const approverRole = String(approverRoleRaw || "").toLowerCase();
  const isFinanceRole = approverRole.includes("finance");
  const showSendPayment = isSendPayment || isFinanceRole;

  const buttonClass =
    "rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-60";

  const runAction = async (key, action, { toastMessage } = {}) => {
    if (!claimId) {
      setError("Invalid claim id. Check pending approvals response.");
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[ApprovalActionPanel] Missing claimId", claim);
      }
      return false;
    }
    setLoading((prev) => ({ ...prev, [key]: true }));
    setError("");
    setSuccess("");
    try {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[ApprovalActionPanel] action", key, {
          claimId,
          currentUserId,
        });
      }
      await action();
      setSuccess("Action completed successfully.");
      if (toastMessage) {
        setToast({ tone: "success", message: toastMessage });
      }
      if (onSuccess) onSuccess();
      return true;
    } catch (err) {
      setError(err.message || "Action failed.");
      if (toastMessage) {
        setToast({ tone: "error", message: err.message || "Action failed." });
      }
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleApprove = async () => {
    if (isSpecialApprover) {
      const payload = {
        reimbursementClaimID: claimId,
        specialApproverUserID: currentUserId,
        remarks: "Approved by special approver",
      };
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("Special approver payload", payload);
      }
      return runAction("approve", () =>
        reimbursementApi.approveSpecialApprover(payload)
      );
    }
    if (isFinance) {
      setError("Use Send Payment for finance approvals.");
      return false;
    }
    if (isHr) {
      return runAction("approve", () =>
        reimbursementApi.approveHr({
          reimbursementClaimID: claimId,
          hrUserID: currentUserId,
          remarks: "Approved by HR",
        })
      );
    }

    return runAction("approve", () =>
      reimbursementApi.approveManager({
        reimbursementClaimID: claimId,
        managerUserID: currentUserId,
        remarks: "Approved by manager",
      })
    );
  };

  const handleReject = async () =>
    runAction("reject", () =>
      reimbursementApi.rejectClaim({
        reimbursementClaimID: claimId,
        actionBy: currentUserId,
        remarks: "Rejected",
      })
    );

  const handleSendBack = async () =>
    runAction("sendBack", () =>
      reimbursementApi.sendBackClaim({
        reimbursementClaimID: claimId,
        actionBy: currentUserId,
        remarks: "Sent back",
      })
    );

  const handleSendPayment = async () => {
    if (!transactionId.trim()) {
      setError("Transaction ID is required.");
      return false;
    }
    const ok = await runAction(
      "sendPayment",
      () =>
        reimbursementApi.sendPayment({
          reimbursementClaimID: claimId,
          financeUserID: currentUserId,
          transactionID: transactionId.trim(),
          TransactionID: transactionId.trim(),
          remarks: paymentRemarks.trim() || undefined,
        }),
      { toastMessage: "Payment sent successfully." }
    );
    if (ok) {
      window.dispatchEvent(new Event("reimb:refreshCounts"));
    }
    return ok;
  };

  const handleMarkPaid = async () =>
    runAction("markPaid", () =>
      reimbursementApi.markPaid({
        reimbursementClaimID: claimId,
        actionBy: currentUserId,
        remarks: "Marked paid",
      })
    );

  const handleView = () => {
    if (claimId) {
      window.location.href = `/claims/${claimId}`;
    }
  };

  if (isHr && !isViewOnly) {
    return null;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-xs font-semibold text-rose-500">{error}</p>
      ) : null}
      {success ? (
        <p className="text-xs font-semibold text-emerald-600">{success}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold text-slate-400">
          ClaimID: {claimId || "NA"}
        </span>
        {isViewOnly ? (
          <button
            onClick={handleView}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            View
          </button>
        ) : null}
        {isApproveReject ? (
          <>
            {!showSendPayment ? (
              <button
                onClick={handleApprove}
                disabled={loading.approve}
                className={`${buttonClass} bg-emerald-600`}
              >
                {loading.approve ? "Approving..." : "Approve"}
              </button>
            ) : null}
            <button
              onClick={handleReject}
              disabled={loading.reject}
              className={`${buttonClass} bg-rose-500`}
            >
              {loading.reject ? "Rejecting..." : "Reject"}
            </button>
          </>
        ) : null}
        {showSendPayment ? (
          <button
            onClick={() => setPaymentOpen(true)}
            disabled={loading.sendPayment}
            className={`${buttonClass} bg-slate-900`}
          >
            {loading.sendPayment ? "Sending..." : "Send Payment"}
          </button>
        ) : null}
        {!isApproveReject && !showSendPayment && !isViewOnly ? (
          <>
            <button
              onClick={handleApprove}
              disabled={loading.approve}
              className={`${buttonClass} bg-emerald-600`}
            >
              {loading.approve ? "Approving..." : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={loading.reject}
              className={`${buttonClass} bg-rose-500`}
            >
              {loading.reject ? "Rejecting..." : "Reject"}
            </button>
            <button
              onClick={handleSendBack}
              disabled={loading.sendBack}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
            >
              {loading.sendBack ? "Sending..." : "Send Back"}
            </button>
            {canPaid ? (
              <button
                onClick={handleMarkPaid}
                disabled={loading.markPaid}
                className={`${buttonClass} bg-slate-900`}
              >
                {loading.markPaid ? "Marking..." : "Mark Paid"}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      {paymentOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Send Payment</h3>
            <p className="mt-1 text-xs text-slate-500">
              Add the transaction details before submitting payment.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Transaction ID
                </label>
                <input
                  value={transactionId}
                  onChange={(event) => setTransactionId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Enter transaction reference"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Remarks (optional)
                </label>
                <textarea
                  value={paymentRemarks}
                  onChange={(event) => setPaymentRemarks(event.target.value)}
                  rows="3"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Add payment notes"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setPaymentOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const ok = await handleSendPayment();
                  if (ok) {
                    setPaymentOpen(false);
                    setTransactionId("");
                    setPaymentRemarks("");
                  }
                }}
                disabled={loading.sendPayment}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading.sendPayment ? "Sending..." : "Submit Payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div className="fixed right-4 top-4 z-50">
          <div
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg ${
              toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ApprovalActionPanel;
