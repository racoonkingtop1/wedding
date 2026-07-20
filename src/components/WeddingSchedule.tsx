import { 
  Wine, 
  Heart, 
  Utensils, 
  Cake, 
  Sparkles, 
  Camera, 
  PartyPopper,
  HelpCircle
} from 'lucide-react';
import { TimelineEvent, ThemeConfig } from '../types';

interface WeddingScheduleProps {
  events: TimelineEvent[];
  theme: ThemeConfig;
}

const getEventIcon = (iconName: string, size = 20) => {
  switch (iconName) {
    case 'welcome':
      return <Wine size={size} className="text-inherit" />;
    case 'ceremony':
      return <Heart size={size} className="text-inherit" />;
    case 'banquet':
      return <Utensils size={size} className="text-inherit" />;
    case 'cake':
      return <Cake size={size} className="text-inherit" />;
    case 'sparklers':
      return <Sparkles size={size} className="text-inherit" />;
    case 'photos':
      return <Camera size={size} className="text-inherit" />;
    case 'dance':
      return <PartyPopper size={size} className="text-inherit" />;
    default:
      return <HelpCircle size={size} className="text-inherit" />;
  }
};

export default function WeddingSchedule({ events, theme }: WeddingScheduleProps) {
  // Sort events chronologically by time string
  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="w-full relative py-2">
      {/* Vertical center/side line */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800 transform -translate-x-1/2 opacity-60 pointer-events-none" />

      <div className="space-y-8 relative">
        {sortedEvents.map((event, index) => {
          const isEven = index % 2 === 0;
          
          return (
            <div 
              key={event.id} 
              id={`timeline-event-${event.id}`}
              className={`flex flex-col md:flex-row items-start md:items-center justify-between relative w-full`}
            >
              {/* Timeline dot / Icon Container */}
              <div 
                className={`absolute left-6 md:left-1/2 transform -translate-x-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  theme.name === 'Электро Неон' 
                    ? 'bg-zinc-950 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                    : theme.name === 'Бордовый Романс'
                      ? 'bg-white border-rose-800 text-rose-800 shadow-sm'
                      : theme.name === 'Эко Шалфей'
                        ? 'bg-stone-50 border-emerald-700 text-emerald-700'
                        : 'bg-white border-amber-600 text-amber-600 shadow-sm'
                }`}
              >
                {getEventIcon(event.icon)}
              </div>

              {/* Content Panel */}
              <div className={`w-full md:w-[42%] ml-16 md:ml-0 ${isEven ? 'md:mr-auto md:text-right' : 'md:ml-auto md:text-left'}`}>
                <div 
                  className={`p-5 rounded-2xl ${theme.cardBgClass} transition-all duration-300 hover:shadow-lg`}
                  style={{
                    boxShadow: theme.name === 'Электро Неон' ? '0 0 15px rgba(168,85,247,0.05)' : undefined
                  }}
                >
                  <div className={`flex items-baseline gap-2 mb-1 justify-start ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                    <span 
                      className={`text-lg md:text-xl font-black font-display tracking-tight ${
                        theme.name === 'Электро Неон' 
                          ? 'text-fuchsia-400' 
                          : theme.name === 'Бордовый Романс' 
                            ? 'text-rose-800' 
                            : theme.name === 'Эко Шалфей'
                              ? 'text-emerald-700'
                              : 'text-amber-600'
                      }`}
                    >
                      {event.time}
                    </span>
                    <span className="text-zinc-400 font-mono text-xs">•</span>
                    <h4 className={`text-base md:text-lg font-bold leading-tight ${theme.textPrimaryClass}`}>
                      {event.title}
                    </h4>
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${theme.textSecondaryClass}`}>
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Empty Spacer column for desktop symmetry */}
              <div className="hidden md:block w-[42%]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
