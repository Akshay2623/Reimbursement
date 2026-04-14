import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Reimbursements
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Claims Command Center
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/claims/new"
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            New Claim
          </Link>
          <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300">
            Export
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
