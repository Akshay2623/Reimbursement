const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
};

export default PageHeader;
