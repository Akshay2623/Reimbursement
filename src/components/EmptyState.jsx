const EmptyState = ({ title, description, action }) => {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="max-w-sm">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
};

export default EmptyState;
