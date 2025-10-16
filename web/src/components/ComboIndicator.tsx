import './ComboIndicator.css';

interface ComboIndicatorProps {
  comboCount: number;
}

export default function ComboIndicator({ comboCount }: ComboIndicatorProps) {
  return (
    <div className="combo-indicator">
      {comboCount > 5 && (
        <div className="combo">🔥 {comboCount}x COMBO!</div>
      )}
    </div>
  );
}

