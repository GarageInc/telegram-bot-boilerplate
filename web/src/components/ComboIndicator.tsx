interface ComboIndicatorProps {
  comboCount: number;
}

export default function ComboIndicator({ comboCount }: ComboIndicatorProps) {
  if (comboCount <= 5) return null;

  return (
    <div className="mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg">
      <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Combo</div>
      <div className="text-xl font-bold">🔥 {comboCount}x</div>
    </div>
  );
}
