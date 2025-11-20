
export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  LEGENDARY = 'Legendary',
  LIMITED = 'Limited'
}

export interface GiftMetadata {
  bgGradient: string;
  pattern: string;
  icon: string;
}

export interface GiftPrototype {
  id: string;
  name: string;
  basePrice: number;
  maxSupply: number;
  currentSupply: number;
  rarity: Rarity;
  imageUrl?: string; // Optional override
}

export interface GiftInstance {
  uuid: string; // Unique instance ID
  tokenId: number; // The #123 number
  prototypeId: string;
  ownerUsername: string;
  mintedAt: string;
  metadata: GiftMetadata; // Specific visual traits generated on mint
  forSalePrice?: number; // If defined and > 0, the item is listed on the P2P market
}

export interface User {
  username: string;
  passwordHash: string; // Simple simulation
  balance: number;
  isAdmin: boolean;
  joinedAt: string;
}

export interface AppState {
  users: User[];
  giftPrototypes: GiftPrototype[];
  giftInstances: GiftInstance[];
  currentUser: User | null;
}
