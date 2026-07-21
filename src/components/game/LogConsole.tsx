import type { GameLog } from "../../core/types";

interface LogConsoleProps {
  logs: GameLog[];
}

export function LogConsole({ logs }: LogConsoleProps) {
  const getLogStyles = (type: GameLog['type']) => {
    switch (type) {
      case 'phase':
        return 'text-amber-400 font-bold bg-amber-950/20 border-y border-amber-950/30 py-1.5 px-3 rounded-md text-center block w-full mt-2 mb-1';
      case 'success':
        return 'text-emerald-400 font-semibold bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-xl';
      case 'failure':
      case 'elimination':
        return 'text-rose-400 font-semibold bg-rose-950/20 border border-rose-900/30 p-2 rounded-xl';
      case 'victory':
        return 'text-yellow-400 font-extrabold text-base bg-yellow-950/30 border-2 border-yellow-500/30 p-3 rounded-2xl text-center block w-full shadow-lg';
      case 'bid':
        return 'text-purple-400 font-medium';
      case 'reveal-rose':
        return 'text-rose-350';
      case 'reveal-skull':
        return 'text-rose-600 font-bold';
      case 'place':
        return 'text-blue-400';
      case 'system':
        return 'text-zinc-400 italic';
      default:
        return 'text-zinc-300';
    }
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col h-full">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Événements</h3>
      
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
        {logs.map((log) => (
          <div key={log.id} className="text-xs flex flex-col gap-0.5 leading-relaxed">
            <span className="text-[10px] text-zinc-600 font-mono self-start">{log.timestamp}</span>
            <div className={`px-1.5 ${getLogStyles(log.type)}`}>
              {log.message}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-zinc-650 text-center py-8">Aucun événement pour le moment.</div>
        )}
      </div>
    </div>
  );
}
