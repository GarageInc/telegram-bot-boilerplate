import './Stats.css';

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
    <div className="stats">
      <h1>🎮 Clicker Game</h1>
      <div className="stat-item">
        Your clicks: <span className="stat-value">{formatNumber(clickCount)}</span>
      </div>
      <div className="stat-item">
        Global clicks: <span className="stat-value">{formatNumber(globalCount)}</span>
      </div>
      <div className="stat-item">
        Pending: <span className="stat-value">{pendingClicks}</span>
      </div>
    </div>
  );
}

