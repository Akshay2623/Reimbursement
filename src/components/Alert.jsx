const variants = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

const Alert = ({ tone = "info", message }) => {
  if (!message) return null;

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${variants[tone]}`}>
      {message}
    </div>
  );
};

export default Alert;
