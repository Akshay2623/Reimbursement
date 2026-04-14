const StatCard = ({ label, value, trend }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {trend ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {trend}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default StatCard;
