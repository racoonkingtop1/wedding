import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { THEMES } from './themes';
import { INITIAL_WEDDING_CONFIG } from './initialData';
import { translations, Language } from './translations';

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

// Stevie Wonder — Isn't She Lovely, hosted on the couple's own Yandex Disk
// instead of YouTube, which loaded unreliably for some guests depending on
// their connection/region. Yandex's public API issues a short-lived signed
// download link, so a fresh one is fetched on every page load rather than
// hardcoding a URL that would eventually expire.
const YANDEX_DISK_PUBLIC_KEY = 'https://disk.yandex.com/d/4-1lUIs42byA6g';
const YANDEX_DOWNLOAD_API = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(YANDEX_DISK_PUBLIC_KEY)}`;

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

/**
 * Thin decorative zigzag stripe used to fill the side gutters left by the
 * narrower hero blocks (music widget, date stamp) versus the wider card.
 * Hidden entirely below the `sm` breakpoint so mobile is unaffected, then
 * eases in across sm/md/lg as there's more room for it to breathe.
 */
function ZigzagStripe({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden="true"
      className={`hidden sm:block absolute top-3 bottom-3 w-2.5 opacity-40 md:opacity-70 lg:opacity-100 transition-opacity duration-500 pointer-events-none ${
        side === 'left' ? 'left-1' : 'right-1'
      }`}
      style={{
        backgroundImage:
          'linear-gradient(135deg, #8C6F56 25%, transparent 25%), linear-gradient(225deg, #8C6F56 25%, transparent 25%)',
        backgroundSize: '10px 10px',
        backgroundPosition: '0 0, 5px 0',
        maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
      }}
    />
  );
}

export default function App() {
  const config = INITIAL_WEDDING_CONFIG;
  const theme = THEMES.retro;

  const [language, setLanguage] = useState<Language>('ru');
  const t = translations[language];

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const notificationHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationUnmountTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  // Preload the wedding song alongside the page preloader. `canplaythrough` means
  // the browser has buffered enough to play without stalling, so the real play
  // button starts instantly instead of waiting on the network.
  //
  // The file itself is fetched (not just linked) with referrerPolicy: 'no-referrer'
  // and played from a local blob URL, because Yandex Disk's download endpoint
  // returns 403 when a Referer header is present — which real browsers send by
  // default on a direct <audio src> request to a cross-origin link.
  useEffect(() => {
    let cancelled = false;
    let audio: HTMLAudioElement | null = null;
    let objectUrl: string | null = null;
    const handleReady = () => setIsPlayerReady(true);

    fetch(YANDEX_DOWNLOAD_API)
      .then((res) => res.json())
      .then((data: { href?: string }) => {
        if (cancelled || !data.href) return;
        return fetch(data.href, { referrerPolicy: 'no-referrer' });
      })
      .then((res) => (res && res.ok ? res.blob() : Promise.reject(new Error('Bad response fetching song file'))))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        audio = new Audio(objectUrl);
        audio.loop = true;
        audio.volume = 0.35;
        audio.preload = 'auto';
        audioRef.current = audio;
        audio.addEventListener('canplaythrough', handleReady, { once: true });
        audio.load();
      })
      .catch((err) => {
        console.warn('Failed to load wedding song from Yandex Disk', err);
      });

    return () => {
      cancelled = true;
      if (audio) {
        audio.removeEventListener('canplaythrough', handleReady);
        audio.pause();
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
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
    if (!audioRef.current || !isPlayerReady) return;

    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn('Playback prevented by browser user activation policy', err);
      });
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
    triggerNotification(t.linkCopied);
    setTimeout(() => {
      setIsCopiedLink(false);
    }, 3000);
  };

  // Format the wedding date in the currently selected language's locale
  const getFormattedDate = (isoString: string) => {
    try {
      const dateObj = new Date(isoString);
      const formatted = dateObj.toLocaleDateString(t.locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch (e) {
      return language === 'ru' ? 'Четверг, 20 августа 2026 года' : 'Thursday, August 20, 2026';
    }
  };

  const formattedWeddingDate = getFormattedDate(config.date);

  return (
    <div id="wedding-app" className="min-h-screen bg-[#EFE8DC] font-sans text-[#3E352F] flex flex-col items-center justify-start overflow-x-hidden relative selection:bg-[#E2D2BC] py-4 md:py-10">

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
            {t.loading}
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
              {t.onlineInvitation}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
              className="px-2 h-[26px] rounded-full border bg-white border-[#DDD0BC] text-[#6C5E53] hover:text-[#3E352F] transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider"
              title={t.switchLanguage}
            >
              {language === 'ru' ? 'EN' : 'RU'}
            </button>

            {/* Play/Pause background track */}
            <button
              onClick={handleToggleMusic}
              className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                isMusicPlaying
                  ? 'bg-[#8C6F56] border-[#8C6F56] text-white shadow-sm'
                  : 'bg-white border-[#DDD0BC] text-[#6C5E53] hover:text-[#3E352F]'
              }`}
              title={isMusicPlaying ? t.turnMusicOff : t.turnMusicOn}
            >
              {isMusicPlaying ? <Volume2 size={13} className="animate-pulse" /> : <VolumeX size={13} />}
            </button>

            {/* Copy invitation link */}
            <button
              onClick={handleCopyInviteLink}
              className="p-1.5 rounded-full border bg-white border-[#DDD0BC] text-[#6C5E53] hover:text-[#3E352F] transition-all cursor-pointer"
              title={t.copyLink}
            >
              <Link2 size={13} />
            </button>
          </div>
        </div>

        {/* INVITATION CONTENT BODY */}
        <div className="flex-1 pb-6.5 pt-3 relative text-center">
          
          {/* Decorative side zigzag stripes framing the hero area (music widget through the date stamp) */}
          <div className="relative">
          <ZigzagStripe side="left" />
          <ZigzagStripe side="right" />

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
                <div className="text-[11px] font-serif font-black text-[#3E352F] truncate">{t.songTitle}</div>
                <div className="text-[9px] font-sans font-semibold text-[#8C6F56] truncate">{t.songArtist}</div>
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
                {t.weddingInvitation}
              </span>
              <Heart size={13} className="fill-[#8C6F56]" />
            </div>

            {/* Couple names heading */}
            <h1 className="font-serif text-3xl font-black text-[#3E352F] tracking-wide mb-5">
              <span className="block italic text-4xl leading-tight text-[#8C6F56]">{t.brideName}</span>
              <span className="block text-[11px] font-sans font-extrabold tracking-widest mt-1 mb-0.5 text-amber-900/40">{t.andSeparator}</span>
              <span className="block italic text-4xl leading-tight text-[#8C6F56]">{t.groomName}</span>
            </h1>

            {/* 📸 MANDATORY RETRO POLAROID WITH THE EXACT REQUIRED GIF */}
            <div className="w-[260px] bg-white border border-[#EBE4D8] p-3 pb-5 shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500 rounded-sm mb-6">
              <div className="w-full aspect-square bg-stone-100 rounded-sm overflow-hidden border border-stone-200 relative">
                <img
                  src={EXACT_GIF_URL}
                  alt={t.heroPhotoAlt}
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
                {t.polaroidCaption}
              </div>
            </div>

            {/* Wedding Date stamp */}
            <div className="border-t border-b border-dashed border-[#DDD0BC] py-2.5 px-6 max-w-xs mx-auto">
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-amber-900/70 mb-0.5 font-sans">{t.weddingDateLabel}</div>
              <div className="font-serif font-black text-[15px] text-[#3E352F] italic tracking-tight uppercase leading-none">
                {formattedWeddingDate}
              </div>
            </div>
          </div>
          </div>

          {/* 2. COUNTDOWN PANEL */}
          <ScrollReveal>
            <div className="px-5 py-5 bg-[#F3EAE0]/60 border-t border-b border-dashed border-[#D2C5B3] text-center">
              <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#8C6F56] mb-2.5 block font-sans">
                {t.countdownLabel}
              </span>
              <CountdownTimer
                targetDate={config.date}
                theme={theme}
                labels={t.countdown}
                expiredTitle={t.countdownExpiredTitle}
                expiredSubtitle={t.countdownExpiredSubtitle}
              />
            </div>
          </ScrollReveal>

          {/* 3. WELCOME LETTER / INVITATION TEXT */}
          <ScrollReveal>
            <div className="mx-4.5 my-6.5 p-5 bg-[#FAF7F2] border border-[#DDD0BC] rounded-3xl relative shadow-sm">
              {/* Stamp decoration */}
              <div className="absolute top-4.5 right-4.5 w-8 h-8 border border-[#8C6F56] rounded-md flex items-center justify-center text-[8px] font-serif font-bold text-[#8C6F56] opacity-75 rotate-12 select-none">
                LOVE
              </div>

              <h3 className="font-serif italic text-2xl text-[#8C6F56] font-black mb-3 text-center">{t.dearFriend}</h3>
              <p className="text-xs text-[#4E433C] leading-relaxed font-sans italic text-left indent-4 space-y-1.5">
                {t.welcomeText}
              </p>

              {/* Warm signature closing line, revealed as if handwritten */}
              <React.Fragment key={language}>
                <HandwrittenText
                  text={t.handwrittenLine}
                  className="text-center mt-5 font-script text-2xl text-[#8C6F56]"
                />
              </React.Fragment>
            </div>
          </ScrollReveal>

          {/* 4. PLAN OF THE DAY TIMELINE (Detailed Locations) */}
          <div className="mx-4.5 my-6.5 space-y-4">
            <ScrollReveal>
              <div className="text-center">
                <h3 className="font-serif text-2xl font-black text-[#8C6F56] italic">{t.timingTitle}</h3>
                <p className="text-[9px] text-[#6C5E53] uppercase tracking-wider font-extrabold font-sans">{t.timingSubtitle}</p>
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
                      <div className="text-[8px] font-extrabold uppercase text-[#8C6F56] tracking-widest font-sans">{t.registrationLabel}</div>
                      <h4 className="font-serif font-black text-xs text-[#3E352F] uppercase">{t.registrationVenue}</h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#6C5E53] leading-relaxed font-medium">
                    <strong>{t.registrationAddressLabel}</strong> {t.registrationAddress}
                  </p>
                  <p className="text-[11px] text-[#6C5E53] italic bg-amber-50/50 p-2 rounded-lg border border-dashed border-amber-200">
                    {t.registrationNote}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <a
                      href={`https://yandex.ru/maps/?text=${encodeURIComponent("город Верхняя Пышма, улица Юбилейная 15а")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#8C6F56] bg-white border border-[#DDD0BC] rounded-lg px-2.5 py-1 uppercase tracking-wider hover:bg-[#FAF7F2] shadow-xs cursor-pointer"
                    >
                      <MapPin size={10} /> {t.yandexMaps}
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("город Верхняя Пышма, улица Юбилейная 15а")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#6C5E53] bg-white border border-[#DDD0BC] rounded-lg px-2.5 py-1 uppercase tracking-wider hover:bg-[#FAF7F2] shadow-xs cursor-pointer"
                    >
                      {t.googleMaps}
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
                      <div className="text-[8px] font-extrabold uppercase text-[#8C6F56] tracking-widest font-sans">{t.speechLabel}</div>
                      <h4 className="font-serif font-black text-xs text-[#3E352F] uppercase">{t.speechVenue}</h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#6C5E53] leading-relaxed">
                    {t.speechText}
                  </p>
                </div>
              </ScrollReveal>

              {/* Event 3: Zoom conference announcement */}
              <ScrollReveal>
                <div className="p-4 bg-gradient-to-r from-[#F5EEE1] to-[#FAF7F2] border border-[#DDD0BC] rounded-2xl text-left space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#8C6F56] mb-1">
                    <Sparkles size={13} className="animate-spin-slow" />
                    <span className="text-[8px] font-black uppercase tracking-widest font-sans">{t.channelInfoLabel}</span>
                  </div>
                  <p className="text-[11px] text-[#4E433C] leading-normal font-sans italic">
                    {t.channelInfoText}
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
                <h3 className="font-serif text-2xl font-black italic">{t.dressCodeTitle}</h3>
              </div>

              <p className="text-[11px] text-[#6C5E53] leading-relaxed font-medium px-1">
                {t.dressCodeTextBefore} <span className="font-bold text-[#3E352F]">{t.dressCodeBlack}</span> {t.dressCodeOr} <span className="font-bold text-sky-600">{t.dressCodeBlue}</span>{t.dressCodeTextAfter}
              </p>

              {/* Custom display of color options */}
              <div className="flex gap-4 items-center justify-center pt-1.5">
                {/* Black block */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full border border-stone-400 bg-black shadow-md flex items-center justify-center transition-transform hover:scale-105">
                    <div className="w-2 h-2 rounded-full bg-white opacity-25" />
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase text-stone-500">{t.dressCodeBlackSwatch}</span>
                </div>

                {/* Sky Blue block */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full border border-stone-300 bg-[#A0C4FF] shadow-md flex items-center justify-center transition-transform hover:scale-105">
                    <div className="w-2 h-2 rounded-full bg-white opacity-30" />
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase text-stone-500">{t.dressCodeBlueSwatch}</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* 6. WISHLIST & GIFTS */}
          <ScrollReveal>
            <div className="mx-4.5 my-6.5 p-5.5 bg-[#FAF7F2] border border-[#DDD0BC] rounded-3xl text-center space-y-3 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-[#8C6F56] mb-0.5">
                <Gift size={18} />
                <h3 className="font-serif text-2xl font-black italic">{t.giftsTitle}</h3>
              </div>

              <p className="text-[11px] text-[#6C5E53] leading-relaxed font-medium">
                {t.giftsText}
              </p>
            </div>
          </ScrollReveal>

          {/* 7. RSVP / WEDDING CHANNEL POSTCARD */}
          <ScrollReveal>
            <div className="mx-4.5 my-6.5 p-5.5 bg-[#FAF7F2] border border-[#DDD0BC] rounded-3xl text-center shadow-md border-t-2 border-t-[#8C6F56]">
              <div className="border-b border-dashed border-[#DDD0BC] pb-2 mb-4">
                <h3 className="font-serif text-2xl font-black text-[#8C6F56] italic">{t.channelTitle}</h3>
                <span className="text-[8px] font-mono tracking-widest text-[#6C5E53] uppercase font-bold">{t.channelSubtitle}</span>
              </div>

              <p className="text-xs text-[#4E433C] leading-relaxed mb-5 font-sans px-1">
                {t.channelText}
              </p>

              <div className="max-w-[240px] mx-auto bg-white p-3 border border-[#EBE4D8] rounded-2xl shadow-md transition-transform hover:scale-[1.01]">
                <img
                  src="https://i.postimg.cc/fbNWSYYk/kanal-k-svad'be-Pasi-i-Lery.jpg"
                  alt={t.qrAlt}
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
                <span>{t.joinChannel}</span>
              </a>
            </div>
          </ScrollReveal>

          {/* Core watermark credit */}
          <div className="py-3 text-center text-[11px] text-stone-400 font-serif italic">
            {t.footer}
          </div>

        </div>
      </div>

    </div>
  );
}
