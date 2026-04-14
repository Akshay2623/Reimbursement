import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusPill from "../components/StatusPill";
import Alert from "../components/Alert";
import { reimbursementApi } from "../api/reimbursementApi";
import ApprovalActionPanel from "../components/ApprovalActionPanel";
import { useReimbursementActions } from "../hooks/useReimbursementActions";
import { currentUser } from "../lib/currentUser";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const FILE_BASE = API_BASE.replace(/\/api\/?$/, "");

const ClaimDetails = () => {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [items, setItems] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const [itemForm, setItemForm] = useState({
    expenseDate: new Date().toISOString().slice(0, 10),
    expenseType: "",
    amount: "",
    description: "",
    billNo: "",
  });
  const [attachmentForm, setAttachmentForm] = useState({
    fileName: "",
    filePath: "",
    fileType: "",
    uploadedBy: currentUser.userId,
  });

  const {
    loading: actionLoading,
    error: actionError,
    success: actionSuccess,
    setError: setActionError,
    addClaimItem,
    addAttachment,
    submitClaim,
    approveManager,
    approveSpecialApprover,
    approveFinance,
    approveHR,
    rejectClaim,
    sendBackClaim,
    markPaid,
  } = useReimbursementActions();

  const claimId = useMemo(() => Number(id), [id]);

  const normalizeClaim = (data) => {
    if (!data) return null;
    const get = (key, alt) => data?.[key] ?? data?.[alt];
    return {
      ...data,
      ClaimNo: get("ClaimNo", "claimNo") || get("ClaimNumber", "claimNumber"),
      ClaimDate: get("ClaimDate", "claimDate"),
      TotalAmount: get("TotalAmount", "totalAmount"),
      Purpose: get("Purpose", "purpose") || get("Title", "title"),
      CurrentStatusName:
        get("CurrentStatusName", "currentStatusName") || get("Status", "status"),
      ManagerName: get("ManagerName", "managerName"),
      FinanceName: get("FinanceName", "financeName"),
      HRName: get("HRName", "hrName"),
      PaymentTransactionID:
        get("PaymentTransactionID", "paymentTransactionID") ||
        get("TransactionId", "transactionId"),
      PaymentRemarks: get("PaymentRemarks", "paymentRemarks"),
      PaidOn: get("PaidOn", "paidOn") || get("PaymentDate", "paymentDate"),
    };
  };

  const normalizeItems = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item,
      Description: item?.Description ?? item?.description,
      ExpenseType: item?.ExpenseType ?? item?.expenseType,
      Amount: item?.Amount ?? item?.amount,
      ExpenseDate: item?.ExpenseDate ?? item?.expenseDate,
      BillNo: item?.BillNo ?? item?.billNo ?? (item?.NoBill ? "No Bill" : undefined),
    }));
  };

  const normalizeAttachments = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((attachment) => ({
      ...attachment,
      FileName: attachment?.FileName ?? attachment?.fileName,
      FileType: attachment?.FileType ?? attachment?.fileType,
      FilePath: attachment?.FilePath ?? attachment?.filePath,
    }));
  };

  const resolveFileUrl = (path, fileName) => {
    if (path && path.startsWith("local://")) {
      const key = path.replace("local://", "");
      return localStorage.getItem(key) || "";
    }
    if (path && path.startsWith("reimb-attachment:")) {
      return localStorage.getItem(path) || "";
    }
    const safeName = (fileName || path || "").replace(/\s+/g, "_");
    if (claimId && safeName) {
      const cachedKey = `reimb-attachment:${claimId}:${safeName}`;
      const cached = localStorage.getItem(cachedKey);
      if (cached) return cached;
    }
    if (path && (path.startsWith("http://") || path.startsWith("https://"))) return path;
    if (path && path.startsWith("/")) return `${FILE_BASE}${path}`;
    if (path) return `${FILE_BASE}/${path}`;
    return "";
  };

  const loadClaimDetails = async () => {
    if (!claimId) return;
    setLoading(true);
    setLocalError("");
    try {
      const { data } = await reimbursementApi.getClaimDetails(claimId);
      const payload = data?.Data ?? data?.data ?? data ?? {};
      const claimData =
        payload?.Claim ??
        payload?.claim ??
        payload?.ClaimHeader ??
        payload?.ReimbursementClaim ??
        (Array.isArray(payload) ? payload[0] : payload);
      const itemsData =
        payload?.ClaimItems ??
        payload?.claimItems ??
        payload?.Items ??
        payload?.items ??
        (Array.isArray(payload) ? payload[1] : []);
      const attachmentsData =
        payload?.Attachments ??
        payload?.attachments ??
        payload?.Files ??
        payload?.files ??
        (Array.isArray(payload) ? payload[2] : []);
      const approvalData =
        payload?.ApprovalHistory ?? payload?.approvalHistory ?? payload?.History ?? [];
      const timelineData =
        payload?.StatusTimeline ?? payload?.timeline ?? payload?.WorkflowTimeline ?? [];

      setClaim(normalizeClaim(claimData));
      setItems(normalizeItems(itemsData));
      setAttachments(normalizeAttachments(attachmentsData));
      setApprovalHistory(Array.isArray(approvalData) ? approvalData : []);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
    } catch (err) {
      setLocalError(err.message || "Failed to load claim details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaimDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const handleAddClaimItem = async (event) => {
    event.preventDefault();
    if (!itemForm.expenseDate || !itemForm.expenseType || !itemForm.amount) {
      setActionError("Expense date, type, and amount are required.");
      return;
    }
    await addClaimItem({
      reimbursementClaimID: claimId,
      ...itemForm,
    });
    setItemForm({
      expenseDate: new Date().toISOString().slice(0, 10),
      expenseType: "",
      amount: "",
      description: "",
      billNo: "",
    });
    loadClaimDetails();
  };

  const handleAddAttachment = async (event) => {
    event.preventDefault();
    if (!attachmentForm.fileName || !attachmentForm.filePath) {
      setActionError("File name and file path are required.");
      return;
    }
    await addAttachment({
      reimbursementClaimID: claimId,
      ...attachmentForm,
    });
    setAttachmentForm({
      fileName: "",
      filePath: "",
      fileType: "",
      uploadedBy: currentUser.userId,
    });
    loadClaimDetails();
  };

  const itemsCount = items.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={claim?.ClaimNo ? `Claim ${claim.ClaimNo}` : "Claim Details"}
        subtitle="Review line items, attachments, and approval history."
      />

      <Alert tone="error" message={localError || actionError} />
      <Alert tone="success" message={actionSuccess} />

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading claim details...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Claim Summary
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {claim?.Purpose || "-"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Claim Date: {claim?.ClaimDate || "-"}
              </p>
              <p className="text-sm text-slate-500">
                Total Amount: {claim?.TotalAmount ?? "-"}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Current Status
              </p>
              <StatusPill status={claim?.CurrentStatusName || "-"} />
              <p className="text-sm text-slate-500">
                Manager: {claim?.ManagerName || "-"}
              </p>
              <p className="text-sm text-slate-500">
                Finance: {claim?.FinanceName || "-"}
              </p>
              <p className="text-sm text-slate-500">HR: {claim?.HRName || "-"}</p>
              {claim?.PaymentTransactionID || claim?.PaymentRemarks || claim?.PaidOn ? (
                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  <p>
                    Payment Transaction ID: {claim?.PaymentTransactionID || "-"}
                  </p>
                  <p>Payment Remarks: {claim?.PaymentRemarks || "-"}</p>
                  <p>Paid On: {claim?.PaidOn || "-"}</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Claim Items</h3>
          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">No items added yet.</p>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.ReimbursementClaimItemID || index}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {item.Description || "Item"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.ExpenseType || "-"} · {item.Amount ?? "-"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.ExpenseDate || "-"} · Bill {item.BillNo || "-"}
                  </p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddClaimItem} className="mt-5 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Add Claim Item</p>
            <input
              type="date"
              value={itemForm.expenseDate}
              onChange={(event) =>
                setItemForm((prev) => ({
                  ...prev,
                  expenseDate: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <input
              value={itemForm.expenseType}
              onChange={(event) =>
                setItemForm((prev) => ({
                  ...prev,
                  expenseType: event.target.value,
                }))
              }
              placeholder="Expense type"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <input
              type="number"
              value={itemForm.amount}
              onChange={(event) =>
                setItemForm((prev) => ({
                  ...prev,
                  amount: event.target.value,
                }))
              }
              placeholder="Amount"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <input
              value={itemForm.billNo}
              onChange={(event) =>
                setItemForm((prev) => ({
                  ...prev,
                  billNo: event.target.value,
                }))
              }
              placeholder="Bill no"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <textarea
              value={itemForm.description}
              onChange={(event) =>
                setItemForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
              rows="3"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={actionLoading.addClaimItem}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {actionLoading.addClaimItem ? "Saving..." : "Add Claim Item"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Attachments</h3>
          <div className="mt-4 space-y-3">
            {attachments.length === 0 ? (
              <p className="text-sm text-slate-500">No attachments uploaded.</p>
            ) : (
              attachments.map((attachment, index) => {
                const fileName = attachment.FileName || "Attachment";
                const filePath = attachment.FilePath || "";
                const fileType = attachment.FileType || "";
                const fileUrl = resolveFileUrl(filePath, fileName);
                const isImage = fileType.startsWith("image/");
                return (
                  <div
                    key={attachment.ReimbursementAttachmentID || index}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {isImage && fileUrl ? (
                        <img
                          src={fileUrl}
                          alt={fileName}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {fileName}
                        </p>
                        <p className="text-xs text-slate-500">{fileType || "-"}</p>
                        <p className="text-xs text-slate-400">
                          {filePath || "-"}
                        </p>
                      </div>
                    </div>
                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-brand-600"
                      >
                        Open Attachment
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No file link</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleAddAttachment} className="mt-5 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Add Attachment</p>
            <input
              value={attachmentForm.fileName}
              onChange={(event) =>
                setAttachmentForm((prev) => ({
                  ...prev,
                  fileName: event.target.value,
                }))
              }
              placeholder="File name"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <input
              value={attachmentForm.filePath}
              onChange={(event) =>
                setAttachmentForm((prev) => ({
                  ...prev,
                  filePath: event.target.value,
                }))
              }
              placeholder="File path"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <input
              value={attachmentForm.fileType}
              onChange={(event) =>
                setAttachmentForm((prev) => ({
                  ...prev,
                  fileType: event.target.value,
                }))
              }
              placeholder="File type"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={actionLoading.addAttachment}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              {actionLoading.addAttachment ? "Saving..." : "Add Attachment"}
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Approval History</h3>
          <div className="mt-4 space-y-3">
            {approvalHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No approval history yet.</p>
            ) : (
              approvalHistory.map((entry, index) => (
                <div
                  key={entry.ApprovalHistoryID || index}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-600"
                >
                  {Object.entries(entry)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <p key={key}>
                        <span className="font-semibold text-slate-800">
                          {key}:
                        </span>{" "}
                        {String(value)}
                      </p>
                    ))}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Status Timeline</h3>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            {timeline.length === 0 ? (
              <li>No timeline data yet.</li>
            ) : (
              timeline.map((step, index) => (
                <li key={step.TimelineID || index}>
                  {Object.entries(step)
                    .slice(0, 2)
                    .map(([key, value]) => (
                      <span key={key} className="mr-3">
                        <span className="font-semibold text-slate-900">
                          {key}:
                        </span>{" "}
                        {String(value)}
                      </span>
                    ))}
                </li>
              ))
            )}
          </ol>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Actions</h3>
        <ApprovalActionPanel
          claim={claim}
          itemsCount={itemsCount}
          loading={actionLoading}
          onSubmitClaim={submitClaim}
          onApproveManager={approveManager}
          onApproveSpecialApprover={approveSpecialApprover}
          onApproveFinance={approveFinance}
          onApproveHR={approveHR}
          onRejectClaim={rejectClaim}
          onSendBackClaim={sendBackClaim}
          onMarkPaid={markPaid}
        />
      </section>
    </div>
  );
};

export default ClaimDetails;
