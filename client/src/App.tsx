

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">ReachInbox Email Scheduler</h1>
        <p className="text-slate-400 text-sm mb-6">Phase 1 Infrastructure Ready</p>
        <div className="bg-slate-950/50 p-4 rounded-lg text-left text-xs font-mono text-emerald-400 space-y-1">
          <div>✓ MySQL 8.0 Configured</div>
          <div>✓ Redis 7 (AOF) Configured</div>
          <div>✓ Elasticsearch 8.x Configured</div>
          <div>✓ React + Vite + Tailwind Connected</div>
        </div>
      </div>
    </div>
  );
}
