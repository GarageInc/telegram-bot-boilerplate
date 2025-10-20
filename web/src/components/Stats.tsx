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
    <div className="text-center text-white mb-6 animate-fade-in w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-4 drop-shadow-lg">🎮 Clicker Game</h1>
      <div className="space-y-2">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
          <span className="text-xs opacity-90">Your clicks: </span>
          <span className="text-lg font-bold ml-1">{formatNumber(clickCount)}</span>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
          <span className="text-xs opacity-90">Global clicks: </span>
          <span className="text-lg font-bold ml-1">{formatNumber(globalCount)}</span>
        </div>
        {pendingClicks > 0 && (
          <div className="bg-yellow-400/20 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md animate-pulse-soft">
            <span className="text-xs opacity-90">Pending: </span>
            <span className="text-base font-bold ml-1">{pendingClicks}</span>
          </div>
        )}
      </div>
    </div>
  );
}
