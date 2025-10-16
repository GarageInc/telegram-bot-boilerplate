import { useState } from 'react';
import './ClickButton.css';

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
    <div className="click-button-container">
      <button
        className="click-button"
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
          className="click-animation"
          style={{ left: `${anim.x}px`, top: `${anim.y}px` }}
        >
          +1
        </div>
      ))}
    </div>
  );
}

