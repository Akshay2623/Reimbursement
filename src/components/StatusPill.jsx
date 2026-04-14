const statusStyles = {
  Approved: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  "Under Review": "bg-sky-50 text-sky-700",
  Rejected: "bg-rose-50 text-rose-700",
};

const StatusPill = ({ status }) => {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        statusStyles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
};

export default StatusPill;
