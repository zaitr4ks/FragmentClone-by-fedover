
import { AppState, User, GiftPrototype, GiftInstance, Rarity } from '../types';

const STORAGE_KEY = 'fragment_clone_db_v1';

// --- Initial Seed Data ---
const INITIAL_PROTOTYPES: GiftPrototype[] = [
  {
    id: 'star-gift',
    name: 'Blue Star',
    basePrice: 500,
    maxSupply: 10000,
    currentSupply: 0,
    rarity: Rarity.COMMON,
  },
  {
    id: 'diamond-gift',
    name: 'Red Diamond',
    basePrice: 2500,
    maxSupply: 1000,
    currentSupply: 0,
    rarity: Rarity.RARE,
  },
  {
    id: 'crown-gift',
    name: 'Golden Crown',
    basePrice: 10000,
    maxSupply: 100,
    currentSupply: 0,
    rarity: Rarity.LEGENDARY,
  }
];

// --- Helpers ---

export const generateGiftMetadata = (tokenId: number): any => {
  const colors = ['from-blue-500 to-purple-600', 'from-red-500 to-orange-500', 'from-green-400 to-emerald-600', 'from-gray-700 to-gray-900', 'from-indigo-500 to-pink-500'];
  const patterns = ['radial', 'diagonal', 'mesh', 'dots'];
  
  return {
    bgGradient: colors[tokenId % colors.length],
    pattern: patterns[tokenId % patterns.length],
    icon: '🎁'
  };
};

const generateRandomSerial = () => Math.floor(10000000 + Math.random() * 90000000);

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- Local Database Simulation ---

const getDB = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure prototypes exist if DB is old
      if (!parsed.giftPrototypes || parsed.giftPrototypes.length === 0) {
        parsed.giftPrototypes = INITIAL_PROTOTYPES;
      }
      return parsed;
    }
  } catch (e) {
    console.error("DB Read Error", e);
  }
  
  // Initialize New DB
  const initial: AppState = {
    users: [],
    giftPrototypes: INITIAL_PROTOTYPES,
    giftInstances: [],
    currentUser: null
  };
  saveDB(initial);
  return initial;
};

const saveDB = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Trigger a custom event so other parts of the app (and other tabs) know data changed
  window.dispatchEvent(new Event('db-change'));
};

// --- Actions ---

export const subscribeToData = (
  onUsers: (users: User[]) => void,
  onProtos: (protos: GiftPrototype[]) => void,
  onGifts: (gifts: GiftInstance[]) => void
) => {
  const sync = () => {
    const db = getDB();
    onUsers(db.users);
    onProtos(db.giftPrototypes);
    onGifts(db.giftInstances);
  };

  // Initial fetch
  sync();

  // Listen for local changes
  window.addEventListener('db-change', sync);
  
  // Listen for changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) sync();
  });

  return () => {
    window.removeEventListener('db-change', sync);
  };
};

export const apiRegister = async (username: string, passwordHash: string): Promise<boolean> => {
  const db = getDB();
  if (db.users.find(u => u.username === username)) return false;

  const newUser: User = {
    username,
    passwordHash,
    balance: 0,
    isAdmin: username.toLowerCase() === 'admin',
    joinedAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);
  return true;
};

export const apiUpdateBalance = async (username: string, newBalance: number) => {
  const db = getDB();
  const user = db.users.find(u => u.username === username);
  if (user) {
    user.balance = newBalance;
    saveDB(db);
  }
};

export const apiMintGift = async (username: string, prototypeId: string) => {
  const db = getDB();
  const user = db.users.find(u => u.username === username);
  const proto = db.giftPrototypes.find(p => p.id === prototypeId);

  if (!user || !proto) return false;
  if (proto.currentSupply >= proto.maxSupply) return false;
  if (user.balance < proto.basePrice) return false;

  // Transaction Logic
  user.balance -= proto.basePrice;
  proto.currentSupply += 1;
  
  const randomId = generateRandomSerial();
  const newGift: GiftInstance = {
    uuid: generateUUID(),
    tokenId: randomId,
    prototypeId: proto.id,
    ownerUsername: username,
    mintedAt: new Date().toISOString(),
    metadata: generateGiftMetadata(randomId)
  };

  db.giftInstances.push(newGift);
  saveDB(db);
  return true;
};

export const apiAdminGrantGift = async (targetUsername: string, prototypeId: string) => {
  const db = getDB();
  const proto = db.giftPrototypes.find(p => p.id === prototypeId);
  if (!proto) return false;

  proto.currentSupply += 1;
  const randomId = generateRandomSerial();
  const newGift: GiftInstance = {
      uuid: generateUUID(),
      tokenId: randomId,
      prototypeId: proto.id,
      ownerUsername: targetUsername,
      mintedAt: new Date().toISOString(),
      metadata: generateGiftMetadata(randomId)
  };
  db.giftInstances.push(newGift);
  saveDB(db);
  return true;
};

export const apiListForSale = async (uuid: string, price: number) => {
  const db = getDB();
  const gift = db.giftInstances.find(g => g.uuid === uuid);
  if (gift) {
    gift.forSalePrice = Number(price);
    saveDB(db);
  }
};

export const apiUnlist = async (uuid: string) => {
  const db = getDB();
  const gift = db.giftInstances.find(g => g.uuid === uuid);
  if (gift) {
    gift.forSalePrice = 0;
    saveDB(db);
  }
};

export const apiBuySecondary = async (buyerUsername: string, giftUuid: string) => {
  const db = getDB();
  const buyer = db.users.find(u => u.username === buyerUsername);
  const gift = db.giftInstances.find(g => g.uuid === giftUuid);

  if (!buyer || !gift) throw "Data missing";
  if (!gift.forSalePrice || gift.forSalePrice <= 0) throw "Not for sale";
  if (gift.ownerUsername === buyerUsername) throw "Cannot buy own item";
  if (buyer.balance < gift.forSalePrice) throw "Insufficient funds";

  const seller = db.users.find(u => u.username === gift.ownerUsername);
  if (!seller) throw "Seller missing";

  // Transaction
  const price = gift.forSalePrice;
  buyer.balance -= price;
  seller.balance += price;
  
  // Transfer Ownership
  gift.ownerUsername = buyerUsername;
  gift.forSalePrice = 0; // Remove from market

  saveDB(db);
  return true;
};

export const apiUpdatePrototype = async (proto: GiftPrototype) => {
  const db = getDB();
  const idx = db.giftPrototypes.findIndex(p => p.id === proto.id);
  if (idx >= 0) {
    db.giftPrototypes[idx] = proto;
  } else {
    db.giftPrototypes.push(proto);
  }
  saveDB(db);
};
