import { useEffect, useState } from 'react';
import './App.css';
import ClickButton from './components/ClickButton';
import Stats from './components/Stats';
import ComboIndicator from './components/ComboIndicator';
import RateLimitWarning from './components/RateLimitWarning';
import { useTelegram } from './hooks/useTelegram';
import { useClicker } from './hooks/useClicker';

function App() {
  const tg = useTelegram();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    clickCount,
    globalCount,
    pendingClicks,
    comboCount,
    rateLimited,
    handleClick,
    loadStats,
  } = useClicker(tg);

  useEffect(() => {
    if (!tg.initData) {
      setError('Please open this app from Telegram');
      setIsLoading(false);
      return;
    }

    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) {
      setError('Could not identify user');
      setIsLoading(false);
      return;
    }

    loadStats()
      .then(() => setIsLoading(false))
      .catch(() => {
        setError('Failed to initialize game');
        setIsLoading(false);
      });
  }, [tg, loadStats]);

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Stats
        clickCount={clickCount}
        globalCount={globalCount}
        pendingClicks={pendingClicks}
      />
      
      <ClickButton onClick={handleClick} />
      
      <ComboIndicator comboCount={comboCount} />
      
      {rateLimited && <RateLimitWarning />}
    </div>
  );
}

export default App;

