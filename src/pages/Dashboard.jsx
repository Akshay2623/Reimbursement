import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Alert from "../components/Alert";
import { reimbursementApi } from "../api/reimbursementApi";
import { currentUser } from "../lib/currentUser";
import { getStoredUserName } from "../lib/auth";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [counts, setCounts] = useState(null);
  const [rejectedFallback, setRejectedFallback] = useState(null);
  const [approvedFallback, setApprovedFallback] = useState(null);
  const [approverName, setApproverName] = useState(getStoredUserName() || "");
  const [authTick, setAuthTick] = useState(0);

  const handleFetchCounts = async () => {
    if (!currentUser.userId) {
      setError("Approver User ID is required.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await reimbursementApi.getApprovalDashboardCount(
        currentUser.userId
      );
      console.log("Dashboard count response:", data);
      setCounts(data?.Data ?? data?.data ?? data ?? null);
      try {
        const claimsResponse = await reimbursementApi.getMyClaims({
          employeeUserID: currentUser.userId,
        });
        const claimsPayload =
          claimsResponse?.data?.Data ??
          claimsResponse?.data?.data ??
          claimsResponse?.data ??
          [];
        const claimsList =
          (Array.isArray(claimsPayload) && claimsPayload) ||
          claimsPayload?.Claims ||
          claimsPayload?.claims ||
          claimsPayload?.MyClaims ||
          [];
        const list = Array.isArray(claimsList) ? claimsList : [];
        const rejectedCount = list.filter(
          (claim) => {
            const status =
              claim?.CurrentStatusName ??
              claim?.currentStatusName ??
              claim?.Status ??
              claim?.status ??
              "";
            return String(status).toLowerCase().includes("reject");
          }
        ).length;
        setRejectedFallback(rejectedCount);
        const approvedCount = list.filter((claim) => {
          const status =
            claim?.CurrentStatusName ??
            claim?.currentStatusName ??
            claim?.Status ??
            claim?.status ??
            "";
          return String(status).toLowerCase().includes("approve");
        }).length;
        setApprovedFallback(approvedCount);
      } catch (err) {
        setRejectedFallback(null);
        setApprovedFallback(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load approval counts.");
    } finally {
      setLoading(false);
    }
  };

  const resolveCounts = (payload) => {
    const candidates = [];
    if (payload) candidates.push(payload);
    if (payload?.Data) candidates.push(payload.Data);
    if (payload?.data) candidates.push(payload.data);
    if (payload?.Table) candidates.push(payload.Table);
    if (payload?.Table1) candidates.push(payload.Table1);
    if (payload?.Table0) candidates.push(payload.Table0);
    if (payload?.Tables) candidates.push(payload.Tables);

    const firstObject = (value) => (Array.isArray(value) ? value[0] : value);
    const source =
      candidates.map(firstObject).find((item) => item && typeof item === "object") || {};

    const getFirst = (...keys) => {
      for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== "") return value;
      }
      return null;
    };

    let pending = getFirst(
      "PendingApprovals",
      "pendingApprovals",
      "Pending",
      "PendingCount",
      "pendingCount"
    );
    let escalations = getFirst(
      "Escalations",
      "escalations",
      "Escalated",
      "EscalationCount",
      "escalationCount"
    );
    let approved = getFirst(
      "ApprovedToday",
      "approvedToday",
      "Approved",
      "ApprovedCount",
      "ApprovedTodayCount",
      "approvedTodayCount"
    );
    let urgent = getFirst("Urgent", "urgent");
    let overdue = getFirst("Overdue", "overdue");
    let rejected = getFirst(
      "Rejected",
      "rejected",
      "RejectedToday",
      "rejectedToday",
      "RejectedCount",
      "rejectedCount",
      "RejectedTodayCount",
      "rejectedTodayCount"
    );

    const arrayCandidates = [];
    const pushArray = (value) => {
      if (Array.isArray(value)) arrayCandidates.push(value);
    };

    candidates.forEach((item) => {
      pushArray(item);
      pushArray(item?.Table);
      pushArray(item?.Table0);
      pushArray(item?.Table1);
      pushArray(item?.Tables);
      pushArray(item?.Data?.Table);
      pushArray(item?.Data?.Table0);
      pushArray(item?.Data?.Table1);
      pushArray(item?.Data?.Tables);
      pushArray(item?.data?.Table);
      pushArray(item?.data?.Table0);
      pushArray(item?.data?.Table1);
      pushArray(item?.data?.Tables);
    });

    const arrayCandidate =
      arrayCandidates.find((item) => Array.isArray(item) && item.length > 0) || [];
    if (arrayCandidate.length > 0) {
      const firstRow = arrayCandidate[0];
      if (firstRow && typeof firstRow === "object" && !Array.isArray(firstRow)) {
        pending = pending ?? firstRow.PendingCount ?? firstRow.pendingCount;
        escalations = escalations ?? firstRow.EscalationCount ?? firstRow.escalationCount;
        approved =
          approved ??
          firstRow.ApprovedTodayCount ??
          firstRow.approvedTodayCount ??
          firstRow.ApprovedCount ??
          firstRow.approvedCount;
        rejected =
          rejected ??
          firstRow.RejectedTodayCount ??
          firstRow.rejectedTodayCount ??
          firstRow.RejectedCount ??
          firstRow.rejectedCount;
      }

      const keyValue = (labelKeys, valueKeys) => {
        const row = arrayCandidate.find((entry) =>
          labelKeys.some((key) =>
            String(entry?.[key] || "")
              .toLowerCase()
              .includes(labelKeys[0].toLowerCase())
          )
        );
        if (!row) return null;
        for (const valueKey of valueKeys) {
          const value = row?.[valueKey];
          if (value !== undefined && value !== null && value !== "") return value;
        }
        return null;
      };

      pending =
        pending ??
        keyValue(["pending"], ["Value", "Count", "Total", "PendingApprovals"]);
      escalations =
        escalations ??
        keyValue(["escalation"], ["Value", "Count", "Total", "Escalations"]);
      approved =
        approved ??
        keyValue(["approved", "approvedtoday", "approved today"], [
          "Value",
          "Count",
          "Total",
          "ApprovedToday",
          "ApprovedTodayCount",
        ]);
      rejected =
        rejected ??
        keyValue(["rejected", "rejectedtoday", "rejected today"], [
          "Value",
          "Count",
          "Total",
          "RejectedToday",
          "RejectedTodayCount",
          "RejectedCount",
        ]);
    }

    if (Array.isArray(source) && source.length >= 3) {
      pending = pending ?? source[0]?.Value ?? source[0]?.Count;
      escalations = escalations ?? source[1]?.Value ?? source[1]?.Count;
      approved = approved ?? source[2]?.Value ?? source[2]?.Count;
    }

    const toDisplay = (value, fallback = "-") =>
      value !== null && value !== undefined && value !== "" ? value : fallback;

    return {
      pending: toDisplay(pending, 0),
      escalations: toDisplay(escalations, 0),
      approved: toDisplay(approved, 0),
      urgent: toDisplay(urgent),
      overdue: toDisplay(overdue),
      rejected: toDisplay(rejected),
    };
  };

  const cards = [
    {
      label: "Pending Approvals",
      value: resolveCounts(counts).pending,
      //trend: resolveCounts(counts).urgent ? `${resolveCounts(counts).urgent} urgent` : null,
    },
    {
      label: "Rejected",
      value:
        resolveCounts(counts).rejected !== null &&
        resolveCounts(counts).rejected !== undefined &&
        resolveCounts(counts).rejected !== "" &&
        resolveCounts(counts).rejected !== "-" &&
        Number(resolveCounts(counts).rejected) !== 0
          ? resolveCounts(counts).rejected
          : rejectedFallback ?? resolveCounts(counts).rejected,
      trend: null,
    },
    {
      label: "Approved",
      value:
        resolveCounts(counts).approved !== null &&
        resolveCounts(counts).approved !== undefined &&
        resolveCounts(counts).approved !== "" &&
        resolveCounts(counts).approved !== "-" &&
        Number(resolveCounts(counts).approved) !== 0
          ? resolveCounts(counts).approved
          : approvedFallback ?? resolveCounts(counts).approved,
     // trend: resolveCounts(counts).rejected ? `${resolveCounts(counts).rejected} rejected` : null,
    },
  ];

  useEffect(() => {
    handleFetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authTick]);

  useEffect(() => {
    const handleRefresh = () => {
      handleFetchCounts();
    };
    window.addEventListener("reimb:refreshCounts", handleRefresh);
    return () => window.removeEventListener("reimb:refreshCounts", handleRefresh);
  }, []);

  useEffect(() => {
    const loadUserName = async () => {
      if (getStoredUserName()) {
        setApproverName(getStoredUserName());
        return;
      }
      try {
        const { data } = await reimbursementApi.getUserMaster();
        const payload = data?.Data ?? data?.data ?? data ?? [];
        const list = Array.isArray(payload) ? payload : payload?.Users || [];
        const match = list.find(
          (item) => Number(item?.ID ?? item?.id) === Number(currentUser.userId)
        );
        const name = match?.Value ?? match?.value ?? match?.FullName ?? match?.fullName;
        if (name) setApproverName(name);
      } catch (err) {
        setApproverName(getStoredUserName() || "");
      }
    };
    loadUserName();
  }, [authTick]);

  useEffect(() => {
    const handleAuthChange = () => setAuthTick((prev) => prev + 1);
    window.addEventListener("auth:changed", handleAuthChange);
    return () => window.removeEventListener("auth:changed", handleAuthChange);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Monitor approval workload and recent claim performance."
      />

      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="text-sm text-slate-500">
          Approver: {approverName || "Current User"}{" "}
          <span className="text-slate-400">(ID: {currentUser.userId || "-"})</span>
        </div>
        <button
          onClick={handleFetchCounts}
          disabled={loading}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </section>

      <Alert tone="error" message={error} />
      <Alert tone="success" message={success} />

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            trend={card.trend}
          />
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
