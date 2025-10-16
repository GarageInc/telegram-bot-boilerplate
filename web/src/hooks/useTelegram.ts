import { useEffect, useState } from 'react';
import type { TelegramWebApp } from '../types/telegram';

export function useTelegram() {
  const [tg] = useState<TelegramWebApp>(() => {
    const telegram = window.Telegram?.WebApp;
    
    if (telegram) {
      telegram.ready();
      telegram.expand();
      telegram.enableClosingConfirmation();
    }
    
    return telegram;
  });

  return tg;
}

