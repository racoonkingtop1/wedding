import { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';

interface CountdownTimerProps {
  targetDate: string;
  theme: ThemeConfig;
  labels: { days: string; hours: string; minutes: string; seconds: string };
  expiredTitle: string;
  expiredSubtitle: string;
}

export default function CountdownTimer({ targetDate, theme, labels, expiredTitle, expiredSubtitle }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className={`text-center py-6 px-4 rounded-xl ${theme.cardBgClass} border border-opacity-10 backdrop-blur-md`}>
        <h3 className={`text-2xl font-semibold mb-2 ${theme.textPrimaryClass}`}>
          {expiredTitle}
        </h3>
        <p className={`${theme.textSecondaryClass}`}>
          {expiredSubtitle}
        </p>
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: labels.days },
    { value: timeLeft.hours, label: labels.hours },
    { value: timeLeft.minutes, label: labels.minutes },
    { value: timeLeft.seconds, label: labels.seconds }
  ];

  return (
    <div id="countdown-timer" className="w-full">
      <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-xl mx-auto">
        {timeUnits.map((unit, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center justify-center p-3 md:p-5 rounded-2xl ${theme.cardBgClass} relative overflow-hidden transition-all duration-300 transform hover:scale-[1.03]`}
            style={{
              boxShadow: theme.name === 'Электро Неон' ? '0 0 15px rgba(168, 85, 247, 0.08)' : undefined
            }}
          >
            {/* Ambient subtle glow for Electro theme */}
            {theme.name === 'Электро Неон' && (
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
            )}
            
            <span className="text-2xl md:text-4xl font-extrabold tracking-tight font-display mb-1 text-center leading-none">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] md:text-xs uppercase tracking-wider font-medium opacity-80 text-center select-none text-zinc-500">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
