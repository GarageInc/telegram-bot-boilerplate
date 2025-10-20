interface ComboIndicatorProps {
  comboCount: number;
}

export default function ComboIndicator({ comboCount }: ComboIndicatorProps) {
  if (comboCount <= 5) return null;

  return (
    <div className="mt-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce-soft">
      <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Combo</div>
      <div className="text-4xl font-bold">🔥 {comboCount}x</div>
    </div>
  );
}
