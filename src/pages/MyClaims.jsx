import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Alert from "../components/Alert";
import { reimbursementApi } from "../api/reimbursementApi";
import { currentUser } from "../lib/currentUser";

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizeClaim = (claim) => {
    const get = (key, altKey) => claim?.[key] ?? claim?.[altKey];
    return {
      id:
        Number(get("ReimbursementClaimID", "reimbursementClaimID")) ||
        Number(get("ClaimID", "claimID")) ||
        Number(get("ID", "id")) ||
        0,
      claimNo: get("ClaimNo", "claimNo") || get("ClaimNumber", "claimNumber"),
      claimDate: get("ClaimDate", "claimDate"),
      totalAmount: get("TotalAmount", "totalAmount"),
      purpose: get("Purpose", "purpose") || get("Title", "title"),
      status: get("CurrentStatusName", "currentStatusName") || get("Status", "status"),
      manager: get("ManagerName", "managerName"),
      finance: get("FinanceName", "financeName"),
      claimType: get("ClaimTypeName", "claimTypeName"),
      paymentTransactionId:
        get("PaymentTransactionID", "paymentTransactionID") ||
        get("TransactionId", "transactionId"),
      paymentRemarks: get("PaymentRemarks", "paymentRemarks"),
      paidOn: get("PaidOn", "paidOn") || get("PaymentDate", "paymentDate"),
    };
  };

  const handleFetchClaims = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await reimbursementApi.getMyClaims({
        employeeUserID: currentUser.userId,
      });
      const payload = data?.Data ?? data?.data ?? data ?? [];
      const claimsList =
        (Array.isArray(payload) && payload) ||
        payload?.Claims ||
        payload?.claims ||
        payload?.MyClaims ||
        [];
      const normalized = (Array.isArray(claimsList) ? claimsList : []).map(normalizeClaim);
      setClaims(normalized);
    } catch (err) {
      setError(err.message || "Failed to load claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Claims"
        subtitle="Track your submitted and in-progress reimbursements."
        action={
          <Link
            to="/claims/new"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Create claim
          </Link>
        }
      />

      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="text-sm text-slate-500">
          Showing claims for user ID: {currentUser.userId || "-"}
        </div>
        <button
          onClick={handleFetchClaims}
          disabled={loading}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </section>

      <Alert tone="error" message={error} />
      <Alert tone="success" message={success} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100 md:hidden">
          {claims.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">
              {loading
                ? "Loading claims..."
                : "No claims found. Use the filters above to load data."}
            </div>
          ) : (
            claims.map((claim) => (
              <div key={claim.claimNo || claim.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {claim.claimNo || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {claim.claimDate || "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {claim.totalAmount ?? "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {claim.status || "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Purpose</span>
                    <span className="font-semibold text-slate-700">
                      {claim.purpose || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Manager</span>
                    <span>{claim.manager || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Finance</span>
                    <span>{claim.finance || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Claim Type</span>
                    <span>{claim.claimType || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Transaction ID</span>
                    <span>{claim.paymentTransactionId || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Paid On</span>
                    <span>{claim.paidOn || "-"}</span>
                  </div>
                </div>
                <div className="mt-3 text-right">
                  {claim.id ? (
                    <Link
                      to={`/claims/${claim.id}`}
                      className="text-xs font-semibold text-brand-600"
                    >
                      View Details
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">No ID</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="w-28 px-4 py-3">Claim No</th>
                <th className="w-32 px-4 py-3">Claim Date</th>
                <th className="w-24 px-4 py-3">Total Amount</th>
                <th className="w-32 px-4 py-3">Purpose</th>
                <th className="w-32 px-4 py-3">Status</th>
                <th className="w-28 px-4 py-3 hidden lg:table-cell">Manager</th>
                <th className="w-28 px-4 py-3 hidden lg:table-cell">Finance</th>
                <th className="w-24 px-4 py-3 hidden md:table-cell">Claim Type</th>
                <th className="w-32 px-4 py-3 hidden xl:table-cell">Transaction ID</th>
                <th className="w-32 px-4 py-3 hidden xl:table-cell">Paid On</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan="7">
                    {loading
                      ? "Loading claims..."
                      : "No claims found. Use the filters above to load data."}
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.claimNo || claim.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900 break-words whitespace-normal">
                      {claim.claimNo || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 break-words whitespace-normal">
                      {claim.claimDate || "-"}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900 break-words whitespace-normal">
                      {claim.totalAmount ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 break-words whitespace-normal">
                      {claim.purpose || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 break-words whitespace-normal">
                      {claim.status || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 break-words whitespace-normal hidden lg:table-cell">
                      {claim.manager || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 break-words whitespace-normal hidden lg:table-cell">
                      {claim.finance || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 break-words whitespace-normal hidden md:table-cell">
                      {claim.claimType || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 break-words whitespace-normal hidden xl:table-cell">
                      {claim.paymentTransactionId || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600 break-words whitespace-normal hidden xl:table-cell">
                      {claim.paidOn || "-"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {claim.id ? (
                        <Link
                          to={`/claims/${claim.id}`}
                          className="text-sm font-semibold text-brand-600"
                        >
                          View Details
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">No ID</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyClaims;
