interface StatsProps {
  clickCount: number;
  globalCount: number;
  pendingClicks: number;
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export default function Stats({ clickCount, globalCount, pendingClicks }: StatsProps) {
  return (
    <div className="text-center text-white mb-8 animate-fade-in">
      <h1 className="text-4xl font-bold mb-6 drop-shadow-lg">🎮 Clicker Game</h1>
      <div className="space-y-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg">
          <span className="text-sm opacity-90">Your clicks: </span>
          <span className="text-2xl font-bold ml-2">{formatNumber(clickCount)}</span>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg">
          <span className="text-sm opacity-90">Global clicks: </span>
          <span className="text-2xl font-bold ml-2">{formatNumber(globalCount)}</span>
        </div>
        {pendingClicks > 0 && (
          <div className="bg-yellow-400/20 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg animate-pulse-soft">
            <span className="text-sm opacity-90">Pending: </span>
            <span className="text-xl font-bold ml-2">{pendingClicks}</span>
          </div>
        )}
      </div>
    </div>
  );
}

