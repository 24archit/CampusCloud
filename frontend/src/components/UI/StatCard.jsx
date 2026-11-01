export default function StatCard({ icon: Icon, label, value, sub, iconBg = 'bg-indigo-500/10', iconColor = 'text-indigo-400' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-xs mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
