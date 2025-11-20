
import React from 'react';
import { GiftInstance, GiftPrototype, Rarity } from '../types';
import { Diamond, Sparkles, Crown, Ghost, Tag, X } from 'lucide-react';
import { playSound } from '../services/soundService';
import { Button } from './UI';

interface GiftCardProps {
  prototype: GiftPrototype;
  instance?: GiftInstance; // If present, we show specific traits
  showPrice?: boolean;
  isOwner?: boolean;
  onBuy?: () => void;
  onSell?: () => void;
  onCancelSell?: () => void;
}

const RarityColor = {
  [Rarity.COMMON]: 'text-gray-400',
  [Rarity.RARE]: 'text-blue-400',
  [Rarity.LEGENDARY]: 'text-amber-400',
  [Rarity.LIMITED]: 'text-red-400',
};

const GiftIcon = ({ id, className }: { id: string, className?: string }) => {
  if (id.includes('diamond')) return <Diamond className={className} />;
  if (id.includes('crown')) return <Crown className={className} />;
  if (id.includes('star')) return <Sparkles className={className} />;
  return <Ghost className={className} />;
};

export const GiftCard: React.FC<GiftCardProps> = ({ 
  prototype, 
  instance, 
  showPrice = false, 
  isOwner = false,
  onBuy,
  onSell,
  onCancelSell
}) => {
  const gradient = instance?.metadata.bgGradient || 'from-gray-700 to-gray-800';
  const isSoldOut = !instance && prototype.currentSupply >= prototype.maxSupply;
  const isForSale = instance && instance.forSalePrice && instance.forSalePrice > 0;
  
  const displayPrice = instance?.forSalePrice || prototype.basePrice;

  const handleCardClick = () => {
    if (isSoldOut && !instance) {
      playSound('error');
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative flex flex-col bg-[#1c1c1e] rounded-2xl border overflow-hidden transition-all shadow-lg flex-shrink-0
        ${isForSale ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-[#2c2c2e]'}
        ${isSoldOut ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:border-[#0088cc] hover:-translate-y-1 hover:shadow-[0_10px_40px_-15px_rgba(0,136,204,0.3)]'}
      `}
    >
      {/* Visual Stage */}
      <div className={`h-48 w-full bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}>
        {/* Simulated Pattern Overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" 
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
        
        <div className={`relative z-10 transform transition-transform duration-300 drop-shadow-2xl ${!isSoldOut && 'group-hover:scale-110'}`}>
           <GiftIcon id={prototype.id} className={`w-24 h-24 text-white`} />
        </div>

        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-mono text-white/80 border border-white/10">
          {instance ? `#${instance.tokenId}` : `${prototype.currentSupply}/${prototype.maxSupply}`}
        </div>

        {isSoldOut && (
           <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
             <span className="text-2xl font-bold text-white -rotate-12 border-4 border-white px-4 py-2 rounded-xl">SOLD OUT</span>
           </div>
        )}
        
        {isForSale && (
           <div className="absolute bottom-3 left-3 bg-yellow-500/90 text-black px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg">
             <Tag size={12} /> FOR SALE
           </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 h-full relative">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-white font-bold text-lg">{prototype.name}</h3>
            <span className={`text-xs font-bold uppercase ${RarityColor[prototype.rarity]}`}>
              {prototype.rarity}
            </span>
          </div>
          
          {instance && (
            <p className="text-xs text-gray-500 truncate">Owned by {isOwner ? 'You' : instance.ownerUsername}</p>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-[#2c2c2e]">
          <div className="flex justify-between items-center mb-3">
             <span className="text-gray-400 text-sm">{instance ? 'Value' : 'Price'}</span>
             <div className="flex items-center gap-1 text-white font-bold">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">💎</div>
                {displayPrice.toLocaleString()}
             </div>
          </div>

          {/* Actions - High Z-Index for clickable buttons */}
          <div className="flex gap-2 relative z-30">
            {isOwner ? (
              isForSale ? (
                <Button 
                  variant="danger" 
                  className="w-full text-xs py-1.5 flex items-center justify-center gap-2 cursor-pointer" 
                  onClick={(e) => { e.stopPropagation(); onCancelSell?.(); }}
                >
                  <X size={14} /> Cancel Sale
                </Button>
              ) : (
                <Button 
                  variant="secondary" 
                  className="w-full text-xs py-1.5 flex items-center justify-center gap-2 hover:bg-blue-600 cursor-pointer" 
                  onClick={(e) => { e.stopPropagation(); onSell?.(); }}
                >
                  <Tag size={14} /> Sell on Market
                </Button>
              )
            ) : (
              (showPrice || isForSale) && !isSoldOut && (
                <Button 
                  className="w-full text-sm py-2 cursor-pointer" 
                  onClick={(e) => { e.stopPropagation(); onBuy?.(); }}
                >
                  {instance ? 'Buy from User' : 'Mint Now'}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
