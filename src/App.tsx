import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { THEMES } from './themes';
import { INITIAL_WEDDING_CONFIG } from './initialData';

// Sub-components
import CountdownTimer from './components/CountdownTimer';
import WeddingSchedule from './components/WeddingSchedule';

// Icons
import { 
  Heart, 
  MapPin, 
  Volume2,
  VolumeX,
  Music,
  Link2,
  Calendar,
  Sparkles,
  Play,
  Pause,
  CheckCircle,
  Video,
  Gift,
  Shirt
} from 'lucide-react';

const EXACT_GIF_URL = 'https://i.postimg.cc/sgHcKvGy/pasa-i-lera.gif';

// Stevie Wonder — Isn't She Lovely (Official Audio), played via the YouTube IFrame API
// so we stream from YouTube's licensed player instead of hosting the track ourselves.
const WEDDING_SONG_YOUTUBE_ID = 'kHInwkOJm24';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

/**
 * High-performance, lightweight Scroll Reveal Component using the native IntersectionObserver.
 * Fades and slides elements up elegantly as they enter the viewport.
 */
function ScrollReveal({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.05, // Trigger when at least 5% is visible
        rootMargin: '0px 0px -40px 0px', // Offset slightly for improved timing
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1000ms] ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-10 scale-[0.98]'
      }`}
    >
      {children}
    </div>
  );
}

/**
 * Reveals text one character at a time, like it's being written by hand,
 * starting once the element scrolls into view. Ends with a soft blinking caret.
 */
function HandwrittenText({ text, className }: { text: string; className?: string }) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted || visibleChars >= text.length) return;
    const timeout = setTimeout(() => setVisibleChars((count) => count + 1), 55);
    return () => clearTimeout(timeout);
  }, [hasStarted, visibleChars, text]);

  const isDone = visibleChars >= text.length;

  return (
    <div ref={ref} className={className}>
      {text.slice(0, visibleChars)}
      <span
        className={`inline-block w-[2px] h-[0.9em] align-middle ml-0.5 bg-current ${
          isDone ? 'opacity-0' : 'animate-pulse'
        }`}
      />
    </div>
  );
}

export default function App() {
  const config = INITIAL_WEDDING_CONFIG;
  const theme = THEMES.retro;

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const notificationHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationUnmountTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playerRef = useRef<any>(null);
  const playerInitStarted = useRef(false);
  const hasPreBuffered = useRef(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Preloader: wait for the hero photo, the QR code, and the music player,
  // but never block the page for more than a few seconds if something is slow to load.
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(false);
  const [isQrImageLoaded, setIsQrImageLoaded] = useState(false);
  const [isLoadingTimedOut, setIsLoadingTimedOut] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoadingTimedOut(true), 6000);
    return () => clearTimeout(timeout);
  }, []);

  const isAppReady = (isHeroImageLoaded && isQrImageLoaded && isPlayerReady) || isLoadingTimedOut;

  useEffect(() => {
    if (!isAppReady) return;
    const timeout = setTimeout(() => setShowPreloader(false), 500);
    return () => clearTimeout(timeout);
  }, [isAppReady]);

  // Load the YouTube IFrame API once and mount a hidden player for the wedding song.
  // Guarded with a ref flag so StrictMode's double-invoked effect in dev doesn't
  // create a second player against the same target node.
  useEffect(() => {
    if (playerInitStarted.current) return;
    playerInitStarted.current = true;

    const createPlayer = () => {
      playerRef.current = new window.YT.Player('youtube-audio-player', {
        videoId: WEDDING_SONG_YOUTUBE_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          playlist: WEDDING_SONG_YOUTUBE_ID, // required by YT for looping a single video
          loop: 1,
        },
        events: {
          // Pre-buffer the track while the preloader is up: briefly play it muted so the
          // browser fetches audio data, then pause. That way the real play button starts
          // instantly instead of showing YouTube's usual buffering delay on first press.
          onReady: (event: any) => {
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING && !hasPreBuffered.current) {
              hasPreBuffered.current = true;
              event.target.pauseVideo();
              event.target.seekTo(0);
              event.target.unMute();
              event.target.setVolume(35);
              setIsPlayerReady(true);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = createPlayer;
    }
  }, []);

  // Trigger a brief floating notification that fades in, holds, then fades out
  const triggerNotification = (message: string) => {
    if (notificationHideTimeout.current) clearTimeout(notificationHideTimeout.current);
    if (notificationUnmountTimeout.current) clearTimeout(notificationUnmountTimeout.current);

    setNotificationMessage(message);
    requestAnimationFrame(() => setIsNotificationVisible(true));

    notificationHideTimeout.current = setTimeout(() => setIsNotificationVisible(false), 3000);
    notificationUnmountTimeout.current = setTimeout(() => setNotificationMessage(null), 3300);
  };

  // Toggle playing music with vintage vinyl spin effect
  const handleToggleMusic = () => {
    if (!playerRef.current || !isPlayerReady) return;

    if (isMusicPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  // Copy invitation link
  const handleCopyInviteLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
    } catch (err) {
      // Clipboard access can be blocked by browser permissions; the UI still
      // confirms the action below so the user isn't left without feedback.
    }
    setIsCopiedLink(true);
    triggerNotification('Ссылка на приглашение скопирована!');
    setTimeout(() => {
      setIsCopiedLink(false);
    }, 3000);
  };

  // Format date helper for Russia
  const getFormattedDate = (isoString: string) => {
    try {
      const dateObj = new Date(isoString);
      return dateObj.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      });
    } catch (e) {
      return 'Четверг, 20 августа 2026 года';
    }
  };

  const formattedWeddingDate = getFormattedDate(config.date);

  return (
    <div id="wedding-app" className="min-h-screen bg-[#EFE8DC] font-sans text-[#3E352F] flex flex-col items-center justify-start overflow-x-hidden relative selection:bg-[#E2D2BC] py-4 md:py-10">

      {/* Hidden YouTube player powering the background wedding song */}
      <div id="youtube-audio-player" className="absolute w-px h-px -left-full overflow-hidden opacity-0 pointer-events-none" aria-hidden="true" />

      {/* Full-page preloader shown until the hero photo, QR code and music player are ready */}
      {showPreloader && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-[#EFE8DC] transition-opacity duration-500 ${
            isAppReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#DDD0BC]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#8C6F56] animate-spin" />
            <Heart size={16} className="absolute inset-0 m-auto fill-[#8C6F56] text-[#8C6F56] animate-pulse" />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#8C6F56] font-sans">
            Загрузка приглашения…
          </span>
        </div>
      )}

      {/* 📜 RICH MULTI-LAYER VINTAGE PAPER & NOISE TEXTURES */}
      {/* Texture Layer 1: Cozy fine geometric grain */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#3E352F_1.2px,transparent_1.2px)] [background-size:20px_20px] z-0" />
      
      {/* Texture Layer 2: Delicate antique paper color-wash gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#ECE3D5]/40 to-[#E4DBCB]/75 z-0" />
      
      {/* Texture Layer 3: Warm paper fibers accent */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.14] bg-[radial-gradient(#8C6F56_0.8px,transparent_0.8px)] [background-size:8px_8px] z-0" />
      
      {/* Texture Layer 4: Soft vignette shadow border overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,rgba(140,111,86,0.12)_100%)] z-0" />

      {/* Floating Notification Box: quick smooth fade in, holds, then fades out */}
      {notificationMessage && (
        <div
          className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 max-w-xs w-max bg-[#3E352F] text-[#FAF7F2] text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 border border-[#DDD0BC]/15 font-semibold transition-all duration-300 ease-out ${
            isNotificationVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* SINGLE CENTRALIZED MOBILE-OPTIMIZED CARD WRAPPER */}
      <div 
        id="invitation-container" 
        className="w-full max-w-[430px] bg-[#FAF7F2] rounded-[36px] shadow-[0_25px_60px_rgba(45,36,30,0.18)] border border-[#E1D3BF] overflow-hidden relative flex flex-col z-10"
      >
        
        {/* Floating Utility Top Bar (Simulated custom menu for sound & copy) */}
        <div className="bg-[#FAF7F2]/90 backdrop-blur-sm border-b border-[#DCD0BE] p-3.5 flex items-center justify-between sticky top-0 z-20 px-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#8C6F56] font-mono">
              Онлайн-Приглашение
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Play/Pause background track */}
            <button
              onClick={handleToggleMusic}
              className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                isMusicPlaying 
                  ? 'bg-[#8C6F56] border-[#8C6F56] text-white shadow-sm'
                  : 'bg-white border-[#DDD0BC] text-[#6C5E53] hover:text-[#3E352F]'
              }`}
              title={isMusicPlaying ? 'Выключить музыку' : 'Включить ретро-музыку'}
            >
              {isMusicPlaying ? <Volume2 size={13} className="animate-pulse" /> : <VolumeX size={13} />}
            </button>

            {/* Copy invitation link */}
            <button
              onClick={handleCopyInviteLink}
              className="p-1.5 rounded-full border bg-white border-[#DDD0BC] text-[#6C5E53] hover:text-[#3E352F] transition-all cursor-pointer"
              title="Скопировать ссылку"
            >
              <Link2 size={13} />
            </button>
          </div>
        </div>

        {/* INVITATION CONTENT BODY */}
        <div className="flex-1 pb-6.5 pt-3 relative text-center">
          
          {/* Retro Vinyl Widget */}
          <div className="px-5 pt-3 pb-2 text-center">
            <div className="max-w-xs mx-auto bg-[#F4EEE1] border border-[#DDD0BC] p-2 rounded-2xl flex items-center gap-3 shadow-sm relative overflow-hidden">
              <div 
                className={`w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center relative border border-dashed border-[#8C6F56]/30 ${isMusicPlaying ? 'animate-spin' : ''}`} 
                style={{ animationDuration: '6s' }}
              >
                <div className="w-3 h-3 rounded-full bg-[#8C6F56] border border-zinc-950 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[#FAF7F2]" />
                </div>
                <div className="absolute inset-1 rounded-full border border-dashed border-white/5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-[11px] font-serif font-black text-[#3E352F] truncate">Isn't She Lovely</div>
                <div className="text-[9px] font-sans font-semibold text-[#8C6F56] truncate">Stevie Wonder</div>
              </div>
              <button
                onClick={handleToggleMusic}
                className="w-6.5 h-6.5 rounded-full bg-[#8C6F56] hover:bg-[#725A45] text-white flex items-center justify-center cursor-pointer transition-transform text-xs"
              >
                {isMusicPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
              </button>
            </div>
          </div>

          {/* 1. COVER HERO SECTION */}
          <div className="px-6 pt-5 pb-6 flex flex-col items-center">
            
            {/* Header Stamp Line */}
            <div className="mb-4 text-[#8C6F56] flex items-center gap-1.5 justify-center">
              <Heart size={13} className="fill-[#8C6F56]" />
              <span className="text-[10px] font-extrabold tracking-widest uppercase font-sans">
                Свадебное Приглашение
              </span>
              <Heart size={13} className="fill-[#8C6F56]" />
            </div>

            {/* Couple names heading */}
            <h1 className="font-serif text-3xl font-black text-[#3E352F] tracking-wide mb-5">
              <span className="block italic text-4xl leading-tight text-[#8C6F56]">Валерия</span>
              <span className="block text-[11px] font-sans font-extrabold tracking-widest mt-1 mb-0.5 text-amber-900/40">— И —</span>
              <span className="block italic text-4xl leading-tight text-[#8C6F56]">Павел</span>
            </h1>

            {/* 📸 MANDATORY RETRO POLAROID WITH THE EXACT REQUIRED GIF */}
            <div className="w-[260px] bg-white border border-[#EBE4D8] p-3 pb-5 shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500 rounded-sm mb-6">
              <div className="w-full aspect-square bg-stone-100 rounded-sm overflow-hidden border border-stone-200 relative">
                <img
                  src={EXACT_GIF_URL}
                  alt="Валерия и Павел"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onLoad={() => setIsHeroImageLoaded(true)}
                  onError={() => setIsHeroImageLoaded(true)}
                />
                {/* Vintage overlay texture */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
              </div>
              {/* Polaroid handwritten caption in Marck Script */}
              <div className="text-center pt-3 font-script text-xl text-[#5A4535] italic select-none">
                Счастливы вместе 🤍
              </div>
            </div>

            {/* Wedding Date stamp */}
            <div className="border-t border-b border-dashed border-[#DDD0BC] py-2.5 px-6 max-w-xs mx-auto">
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-amber-900/70 mb-0.5 font-sans">ДАТА ТОРЖЕСТВА</div>
              <div className="font-serif font-black text-[15px] text-[#3E352F] italic tracking-tight uppercase leading-none">
                Четверг, 20 августа 2026 года
              </div>
            </div>
          </div>

          {/* 2. COUNTDOWN PANEL */}
          <ScrollReveal>
            <div className="px-5 py-5 bg-[#F3EAE0]/60 border-t border-b border-dashed border-[#D2C5B3] text-center">
              <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#8C6F56] mb-2.5 block font-sans">
                До счастливого события осталось:
              </span>
              <CountdownTimer targetDate={config.date} theme={theme} />
            </div>
          </ScrollReveal>

          {/* 3. WELCOME LETTER / INVITATION TEXT */}
          <ScrollReveal>
            <div className="mx-4.5 my-6.5 p-5 bg-[#FAF7F2] border border-[#DDD0BC] rounded-3xl relative shadow-sm">
              {/* Stamp decoration */}
              <div className="absolute top-4.5 right-4.5 w-8 h-8 border border-[#8C6F56] rounded-md flex items-center justify-center text-[8px] font-serif font-bold text-[#8C6F56] opacity-75 rotate-12 select-none">
                LOVE
              </div>
              
              <h3 className="font-serif italic text-2xl text-[#8C6F56] font-black mb-3 text-center">Дорогой друг!</h3>
              <p className="text-xs text-[#4E433C] leading-relaxed font-sans italic text-left indent-4 space-y-1.5">
                Мы решили стать семьёй и хотим пригласить тебя разделить с нами этот праздник. Свадьба состоится 20 августа 2026 года. И регистрация, и свадебная речь будут транслироваться в Zoom. Нам важно, чтобы несмотря на расстояние у тебя получилось поприсутствовать на мероприятии. Для нас это лучший подарок.
              </p>
              
              {/* Warm signature closing line, revealed as if handwritten */}
              <HandwrittenText
                text="Будем счастливы видеть твою улыбку :)"
                className="text-center mt-5 font-script text-2xl text-[#8C6F56]"
              />
            </div>
          </ScrollReveal>

          {/* 4. PLAN OF THE DAY TIMELINE (Detailed Locations) */}
          <div className="mx-4.5 my-6.5 space-y-4">
            <ScrollReveal>
              <div className="text-center">
                <h3 className="font-serif text-2xl font-black text-[#8C6F56] italic">Тайминг свадьбы</h3>
                <p className="text-[9px] text-[#6C5E53] uppercase tracking-wider font-extrabold font-sans">Программа праздничного дня</p>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {/* Event 1: Registration ЗАГС */}
              <ScrollReveal>
                <div className="p-4.5 bg-[#FAF7F2] border border-[#DDD0BC] rounded-2xl text-left space-y-2.5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#8C6F56]/10 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#8C6F56]/10 text-[#8C6F56] rounded-lg">
                      <Calendar size={14} />
                    </span>
                    <div>
                      <div className="text-[8px] font-extrabold uppercase text-[#8C6F56] tracking-widest font-sans">РЕГИСТРАЦИЯ БРАКА — 12:30 (МСК)</div>
                      <h4 className="font-serif font-black text-xs text-[#3E352F] uppercase">ЗАГС г. Верхняя Пышма</h4>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-[#6C5E53] leading-relaxed font-medium">
                    <strong>Адрес ЗАГСа:</strong> город Верхняя Пышма, улица Юбилейная 15а.
                  </p>
                  <p className="text-[11px] text-[#6C5E53] italic bg-amber-50/50 p-2 rounded-lg border border-dashed border-amber-200">
                    Если ты захочешь поприсутствовать в ЗАГСе вживую — пожалуйста, напиши нам в мессенджере.
                  </p>

                  <div className="flex gap-2 pt-1">
                    <a
                      href={`https://yandex.ru/maps/?text=${encodeURIComponent("город Верхняя Пышма, улица Юбилейная 15а")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#8C6F56] bg-white border border-[#DDD0BC] rounded-lg px-2.5 py-1 uppercase tracking-wider hover:bg-[#FAF7F2] shadow-xs cursor-pointer"
                    >
                      <MapPin size={10} /> Яндекс Карты
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("город Верхняя Пышма, улица Юбилейная 15а")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#6C5E53] bg-white border border-[#DDD0BC] rounded-lg px-2.5 py-1 uppercase tracking-wider hover:bg-[#FAF7F2] shadow-xs cursor-pointer"
                    >
                      Google Maps
                    </a>
                  </div>
                </div>
              </ScrollReveal>

              {/* Event 2: Ceremony Speech Zoom */}
              <ScrollReveal>
                <div className="p-4.5 bg-[#FAF7F2] border border-[#DDD0BC] rounded-2xl text-left space-y-2 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-sky-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#8C6F56]/10 text-[#8C6F56] rounded-lg">
                      <Video size={14} />
                    </span>
                    <div>
                      <div className="text-[8px] font-extrabold uppercase text-[#8C6F56] tracking-widest font-sans">ТОРЖЕСТВЕННАЯ РЕЧЬ — 15:00 (МСК)</div>
                      <h4 className="font-serif font-black text-xs text-[#3E352F] uppercase">Прямая трансляция в Zoom</h4>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-[#6C5E53] leading-relaxed">
                    Торжественная речь будет произнесена в 15:00 по Московскому времени для всех гостей, кто подключится онлайн.
                  </p>
                </div>
              </ScrollReveal>

              {/* Event 3: Zoom conference announcement */}
              <ScrollReveal>
                <div className="p-4 bg-gradient-to-r from-[#F5EEE1] to-[#FAF7F2] border border-[#DDD0BC] rounded-2xl text-left space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#8C6F56] mb-1">
                    <Sparkles size={13} className="animate-spin-slow" />
                    <span className="text-[8px] font-black uppercase tracking-widest font-sans">ИНФОРМАЦИЯ О КАНАЛЕ</span>
                  </div>
                  <p className="text-[11px] text-[#4E433C] leading-normal font-sans italic">
                    Данные о Zoom-конференции будут отправлены в наш канал незадолго до свадьбы. Сохраните эту страницу!
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* 5. DRESS CODE (Custom vintage color options) */}
          <ScrollReveal>
            <div className="mx-4.5 my-6.5 p-5.5 bg-[#FAF7F2] border border-[#DDD0BC] rounded-3xl text-center space-y-3.5 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-[#8C6F56] mb-0.5">
                <Shirt size={18} />
                <h3 className="font-serif text-2xl font-black italic">Дресс-код</h3>
              </div>

              <p className="text-[11px] text-[#6C5E53] leading-relaxed font-medium px-1">
                Строгого дресс-кода нет, единственное что нужно — иметь на себе любую <span className="font-bold text-[#3E352F]">чёрную</span> или <span className="font-bold text-sky-600">голубую</span> вещь или аксессуар.
              </p>

              {/* Custom display of color options */}
              <div className="flex gap-4 items-center justify-center pt-1.5">
                {/* Black block */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full border border-stone-400 bg-black shadow-md flex items-center justify-center transition-transform hover:scale-105">
                    <div className="w-2 h-2 rounded-full bg-white opacity-25" />
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase text-stone-500">Black / Чёрный</span>
                </div>

                {/* Sky Blue block */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full border border-stone-300 bg-[#A0C4FF] shadow-md flex items-center justify-center transition-transform hover:scale-105">
                    <div className="w-2 h-2 rounded-full bg-white opacity-30" />
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase text-stone-500">Blue / Голубой</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* 6. WISHLIST & GIFTS */}
          <ScrollReveal>
            <div className="mx-4.5 my-6.5 p-5.5 bg-[#FAF7F2] border border-[#DDD0BC] rounded-3xl text-center space-y-3 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-[#8C6F56] mb-0.5">
                <Gift size={18} />
                <h3 className="font-serif text-2xl font-black italic">Про подарки</h3>
              </div>
              
              <p className="text-[11px] text-[#6C5E53] leading-relaxed font-medium">
                Лучший подарок — твоё присутствие и при желании финансовый вклад в наше свадебное путешествие. А ещё лучше не дарить живые цветы 🤍
              </p>
            </div>
          </ScrollReveal>

          {/* 7. RSVP / WEDDING CHANNEL POSTCARD */}
          <ScrollReveal>
            <div className="mx-4.5 my-6.5 p-5.5 bg-[#FAF7F2] border border-[#DDD0BC] rounded-3xl text-center shadow-md border-t-2 border-t-[#8C6F56]">
              <div className="border-b border-dashed border-[#DDD0BC] pb-2 mb-4">
                <h3 className="font-serif text-2xl font-black text-[#8C6F56] italic">Свадебный канал</h3>
                <span className="text-[8px] font-mono tracking-widest text-[#6C5E53] uppercase font-bold">Подтверждение участия</span>
              </div>
              
              <p className="text-xs text-[#4E433C] leading-relaxed mb-5 font-sans px-1">
                Чтобы попасть на мероприятие, пожалуйста, перейдите в наш свадебный канал. Там будет вся важная информация.
              </p>

              <div className="max-w-[240px] mx-auto bg-white p-3 border border-[#EBE4D8] rounded-2xl shadow-md transition-transform hover:scale-[1.01]">
                <img
                  src="https://i.postimg.cc/fbNWSYYk/kanal-k-svad'be-Pasi-i-Lery.jpg"
                  alt="QR-код свадебного канала"
                  className="w-full h-auto rounded-xl"
                  referrerPolicy="no-referrer"
                  onLoad={() => setIsQrImageLoaded(true)}
                  onError={() => setIsQrImageLoaded(true)}
                />
              </div>

              {/* 🚀 TELEGRAM REDIRECT BUTTON */}
              <a 
                href="https://t.me/+-J1EjWWzu4IyNjky"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full py-3.5 bg-[#24A1DE] hover:bg-[#1E8EB8] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.19z"/>
                </svg>
                <span>Перейти в канал</span>
              </a>
            </div>
          </ScrollReveal>

          {/* Core watermark credit */}
          <div className="py-3 text-center text-[11px] text-stone-400 font-serif italic">
            Валерия & Павел • Сохраним этот день вместе • 2026
          </div>

        </div>
      </div>

    </div>
  );
}
