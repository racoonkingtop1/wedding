import { ThemeConfig, ThemeType } from './types';

export const THEMES: Record<ThemeType, ThemeConfig> = {
  retro: {
    name: 'Ретро Романтика',
    bgClass: 'bg-[#F9F5EE] text-[#3E352F] selection:bg-[#EAE1D4] selection:text-[#3E352F]',
    cardBgClass: 'bg-[#F4EEE1] border border-[#E1D3BF] shadow-[4px_4px_0px_rgba(62,53,47,0.1)] rounded-2xl',
    textPrimaryClass: 'text-[#3E352F] font-serif font-bold',
    textSecondaryClass: 'text-[#6C5E53] font-sans',
    accentClass: 'bg-[#8C6F56] hover:bg-[#725A45] text-white shadow-[2px_2px_0px_rgba(62,53,47,0.15)]',
    accentBorderClass: 'border-[#8C6F56]',
    accentHoverClass: 'hover:shadow-[4px_4px_0px_rgba(62,53,47,0.2)] transition-all duration-300',
    titleFont: 'font-serif tracking-wide',
    bodyFont: 'font-sans'
  },
  electro: {
    name: 'Электро Неон',
    bgClass: 'bg-zinc-950 text-white selection:bg-fuchsia-500/30 selection:text-fuchsia-200',
    cardBgClass: 'bg-zinc-900/90 border border-zinc-800 backdrop-blur-md shadow-[0_0_15px_rgba(217,70,239,0.05)]',
    textPrimaryClass: 'text-zinc-50 font-sans tracking-tight',
    textSecondaryClass: 'text-zinc-400 font-sans',
    accentClass: 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]',
    accentBorderClass: 'border-fuchsia-500',
    accentHoverClass: 'hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all duration-300',
    titleFont: 'font-sans font-extrabold tracking-wider uppercase',
    bodyFont: 'font-sans',
    glowEffect: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]'
  },
  classic: {
    name: 'Классический Синий',
    bgClass: 'bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900',
    cardBgClass: 'bg-white border border-slate-200/80 shadow-md shadow-slate-100 rounded-2xl',
    textPrimaryClass: 'text-slate-900 font-serif font-semibold',
    textSecondaryClass: 'text-slate-500 font-sans font-light',
    accentClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/10',
    accentBorderClass: 'border-amber-600',
    accentHoverClass: 'hover:bg-amber-700 hover:shadow-md transition-all duration-300',
    titleFont: 'font-serif tracking-normal',
    bodyFont: 'font-sans'
  },
  minimal: {
    name: 'Эко Шалфей',
    bgClass: 'bg-stone-50 text-stone-800 selection:bg-emerald-100 selection:text-emerald-900',
    cardBgClass: 'bg-stone-100/60 border border-stone-200/60 shadow-sm rounded-xl',
    textPrimaryClass: 'text-stone-800 font-sans tracking-tight font-medium',
    textSecondaryClass: 'text-stone-500 font-sans font-normal',
    accentClass: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm shadow-emerald-700/10',
    accentBorderClass: 'border-emerald-700',
    accentHoverClass: 'hover:bg-emerald-800 hover:shadow-md transition-all duration-300',
    titleFont: 'font-sans font-semibold tracking-wide',
    bodyFont: 'font-sans'
  },
  burgundy: {
    name: 'Бордовый Романс',
    bgClass: 'bg-rose-50/30 text-rose-950 selection:bg-rose-100 selection:text-rose-900',
    cardBgClass: 'bg-white/95 border border-rose-100/80 shadow-md shadow-rose-100/40 rounded-3xl',
    textPrimaryClass: 'text-rose-950 font-serif font-bold',
    textSecondaryClass: 'text-rose-700/80 font-sans',
    accentClass: 'bg-rose-800 hover:bg-rose-900 text-white shadow-sm shadow-rose-800/10',
    accentBorderClass: 'border-rose-800',
    accentHoverClass: 'hover:bg-rose-900 hover:shadow-md transition-all duration-300',
    titleFont: 'font-serif italic tracking-wide',
    bodyFont: 'font-sans'
  }
};
