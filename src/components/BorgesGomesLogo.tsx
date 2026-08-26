import React from 'react';
import logoImage from '../assets/images/borges_gomes_logo_1787780217918.jpg';

interface BorgesGomesLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'image' | 'badge' | 'full';
  className?: string;
}

export const BorgesGomesLogo: React.FC<BorgesGomesLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  variant = 'full',
  className = '',
}) => {
  const sizeMap = {
    xs: { img: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]' },
    sm: { img: 'w-9 h-9', text: 'text-sm', sub: 'text-[10px]' },
    md: { img: 'w-11 h-11', text: 'text-base', sub: 'text-[11px]' },
    lg: { img: 'w-16 h-16', text: 'text-xl', sub: 'text-xs' },
    xl: { img: 'w-24 h-24', text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'image') {
    return (
      <div className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-md border border-amber-500/30 bg-[#0F141C] ${currentSize.img} ${className}`}>
        <img
          src={logoImage}
          alt="Borges & Gomes Engenharia"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Visual Logo Emblem with Border & Glow */}
      <div
        className={`relative flex items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-amber-950/20 border border-amber-500/40 bg-[#0E1217] shrink-0 ${currentSize.img}`}
      >
        <img
          src={logoImage}
          alt="Logo Borges & Gomes Engenharia"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Typography Brand Name */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-tight">
          <span className={`font-serif font-black tracking-wider text-slate-900 dark:text-white ${currentSize.text}`}>
            BORGES & GOMES
          </span>
          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-widest bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded">
            ENGENHARIA
          </span>
        </div>
        {showSubtitle && (
          <p className={`text-slate-500 dark:text-slate-400 font-mono tracking-tight ${currentSize.sub}`}>
            Almoxarifado Central & Gestão de Estoque
          </p>
        )}
      </div>
    </div>
  );
};
