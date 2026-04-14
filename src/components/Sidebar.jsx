import { NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { reimbursementApi } from "../api/reimbursementApi";
import {
  DEFAULT_HR_USER_ID,
  FINANCE_USER_ID,
  SPECIAL_APPROVER_ID,
} from "../config/reimbursementWorkflow";
import { currentUser } from "../lib/currentUser";
import { getAuthToken, logout } from "../lib/auth";
import autovynLogo from "../assets/autovyn-logo.png";

const Sidebar = () => {
  const [counts, setCounts] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [authTick, setAuthTick] = useState(0);

  const isSpecialApprover = currentUser.userId === SPECIAL_APPROVER_ID;
  const isFinance = currentUser.userId === FINANCE_USER_ID;
  const isHr = currentUser.userId === DEFAULT_HR_USER_ID;
  const isAuthenticated = Boolean(getAuthToken());

  const queueLabel = isSpecialApprover
    ? "Special Approval Queue"
    : isFinance
      ? "Finance Queue"
      : isHr
        ? "HR Queue"
        : "Manager Queue";

  const resolveFirstObject = (value) => (Array.isArray(value) ? value[0] : value);
  const countSource = resolveFirstObject(counts);
  const pendingBadge =
    countSource?.PendingCount ??
    countSource?.pendingCount ??
    countSource?.PendingApprovals ??
    countSource?.pendingApprovals ??
    countSource?.TotalPending ??
    countSource?.totalPending ??
    null;

  const navItems = useMemo(() => {
    const items = [{ label: "Dashboard", to: "/", icon: "dashboard" }];
    if (Number(currentUser.userId) !== 75) {
      items.push({ label: "My Claims", to: "/claims", icon: "claims" });
      items.push({ label: "Create Claim", to: "/claims/new", icon: "create" });
    }
    items.push({ label: "Pending Approvals", to: "/approvals", icon: "approvals" });
    return items;
  }, [currentUser.userId, authTick]);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const { data } = await reimbursementApi.getApprovalDashboardCount(
          currentUser.userId
        );
        const payload = data?.Data ?? data?.data ?? data ?? null;
        setCounts(payload || null);
      } catch (err) {
        setCounts(null);
      }
    };

    if (isAuthenticated) {
      loadCounts();
    }

    const handleRefresh = () => {
      if (isAuthenticated) loadCounts();
    };
    window.addEventListener("reimb:refreshCounts", handleRefresh);
    return () => window.removeEventListener("reimb:refreshCounts", handleRefresh);
  }, [isAuthenticated, authTick]);

  useEffect(() => {
    const handleAuthChange = () => setAuthTick((prev) => prev + 1);
    window.addEventListener("auth:changed", handleAuthChange);
    return () => window.removeEventListener("auth:changed", handleAuthChange);
  }, []);

  const iconBase = "h-5 w-5";
  const renderIcon = (name, active) => {
    const color = active ? "text-white" : "text-slate-500";
    switch (name) {
      case "dashboard":
        return (
          <svg viewBox="0 0 24 24" className={`${iconBase} ${color}`} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z" />
          </svg>
        );
      case "claims":
        return (
          <svg viewBox="0 0 24 24" className={`${iconBase} ${color}`} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3h9l3 3v15H6z" />
            <path d="M9 11h6M9 15h6M9 7h3" />
          </svg>
        );
      case "create":
        return (
          <svg viewBox="0 0 24 24" className={`${iconBase} ${color}`} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
            <path d="M4 4h16v16H4z" />
          </svg>
        );
      case "approvals":
        return (
          <svg viewBox="0 0 24 24" className={`${iconBase} ${color}`} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4" />
            <path d="M4 4h16v16H4z" />
          </svg>
        );
      default:
        return (
          <div className={`h-5 w-5 rounded-full border border-current ${color}`} />
        );
    }
  };

  return (
    <aside
      className={`flex w-full flex-col gap-6 border-b border-slate-200 bg-white/90 backdrop-blur overflow-hidden lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r ${
        collapsed ? "p-3 lg:w-20" : "p-6 lg:w-72"
      }`}
    >
      <div className="flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center">
            <img
              src={autovynLogo}
              alt="Autovyn"
              className="h-9 w-auto object-contain"
            />
          </div>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
          aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
          title={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          )}
        </button>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `relative flex items-center rounded-xl text-sm font-semibold transition ${
                collapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-2"
              } ${
                isActive
                  ? "bg-brand-600 text-white shadow-soft"
                  : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
                  {renderIcon(item.icon, isActive)}
                  {!collapsed ? <span>{item.label}</span> : null}
                </div>
                {!collapsed && item.to === "/approvals" && pendingBadge ? (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                    {pendingBadge}
                  </span>
                ) : null}
                {collapsed && item.to === "/approvals" && pendingBadge ? (
                  <span className="absolute right-2 top-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {pendingBadge}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
          className={`mt-2 flex items-center rounded-xl text-sm font-semibold text-slate-600 transition hover:bg-slate-100 ${
            collapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-2"
          }`}
        >
          <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
            <svg viewBox="0 0 24 24" className={`${iconBase} text-slate-500`} fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6H5v12h4" />
              <path d="M16 12H5" />
              <path d="M13 9l3 3-3 3" />
              <path d="M9 6h10v12H9" />
            </svg>
            {!collapsed ? <span>Logout</span> : null}
          </div>
        </button>
      </nav>
      {!collapsed ? (
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            {queueLabel}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              API Base
            </p>
            <p className="mt-1 break-all font-semibold text-slate-700">
              {import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-col items-center gap-2 text-[10px] text-slate-400">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-slate-50">
            {queueLabel.split(" ")[0]}
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-slate-50">
            API
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
