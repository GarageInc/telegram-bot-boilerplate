import { useState } from 'react';

interface ClickButtonProps {
  onClick: () => void;
}

interface ClickAnimation {
  id: number;
  x: number;
  y: number;
}

let animationId = 0;

export default function ClickButton({ onClick }: ClickButtonProps) {
  const [animations, setAnimations] = useState<ClickAnimation[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    onClick();
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    let x: number, y: number;
    
    if ('touches' in e && e.touches[0]) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else if ('clientX' in e) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else {
      x = rect.width / 2;
      y = rect.height / 2;
    }
    
    const id = animationId++;
    setAnimations(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setAnimations(prev => prev.filter(anim => anim.id !== id));
    }, 1000);
  };

  return (
    <div className="relative my-8">
      <button
        className="w-48 h-48 rounded-full bg-white shadow-2xl font-bold text-4xl text-primary-600 
                   active:scale-95 hover:scale-105 transition-all duration-150 
                   border-8 border-primary-200 hover:border-primary-300
                   cursor-pointer select-none relative overflow-visible"
        onClick={handleClick}
        onTouchStart={(e) => {
          e.preventDefault();
          handleClick(e);
        }}
      >
        TAP
      </button>
      
      {animations.map(anim => (
        <div
          key={anim.id}
          className="absolute text-white font-bold text-2xl pointer-events-none animate-fade-in"
          style={{ 
            left: `${anim.x}px`, 
            top: `${anim.y}px`,
            animation: 'fadeOut 1s ease-out forwards'
          }}
        >
          +1
        </div>
      ))}

      <style>{`
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}

