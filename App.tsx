
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  subscribeToData, 
  apiRegister, 
  apiUpdateBalance, 
  apiMintGift, 
  apiListForSale, 
  apiUnlist, 
  apiBuySecondary,
  apiUpdatePrototype,
  apiAdminGrantGift
} from './services/storageService';
import { AppState, User, GiftInstance, GiftPrototype } from './types';
import { Clicker } from './components/Clicker';
import { AdminDashboard } from './components/AdminDashboard';
import { GiftCard } from './components/GiftCard';
import { Button, Input, Card } from './components/UI';
import { LayoutGrid, Hammer, User as UserIcon, LogOut, ShieldCheck, ShoppingBag, Repeat, Loader2, X } from 'lucide-react';
import { playSound } from './services/soundService';

// --- Main Component ---

export default function App() {
  const [state, setState] = useState<AppState>({
    users: [],
    giftPrototypes: [],
    giftInstances: [],
    currentUser: null
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Sell Modal State
  const [sellModal, setSellModal] = useState<{isOpen: boolean, itemId: string | null}>({ isOpen: false, itemId: null });
  const [sellPrice, setSellPrice] = useState('1000');
  
  // Debounce Ref for Balance
  const balanceSyncRef = useRef<{timeout: any, balance: number}>({ timeout: null, balance: 0 });

  // Initialize Data Subscription
  useEffect(() => {
    const unsubscribe = subscribeToData(
      (users) => {
        setState(prev => {
          // If current user exists, update their reference to keep balance in sync
          const updatedCurrentUser = prev.currentUser ? users.find(u => u.username === prev.currentUser!.username) || prev.currentUser : null;
          return { ...prev, users, currentUser: updatedCurrentUser };
        });
        setIsLoading(false);
      },
      (giftPrototypes) => setState(prev => ({ ...prev, giftPrototypes })),
      (giftInstances) => setState(prev => ({ ...prev, giftInstances }))
    );
    return () => unsubscribe();
  }, []);

  // --- Auth Handlers ---

  const login = async (username: string, password: string) => {
    const user = state.users.find(u => u.username === username);
    if (user && user.passwordHash === password) {
      setState(prev => ({ ...prev, currentUser: user }));
      playSound('success');
      return true;
    }
    playSound('error');
    return false;
  };

  const register = async (username: string, password: string) => {
    try {
      const success = await apiRegister(username, password);
      if (success) {
        // Auto login after register
        const user = state.users.find(u => u.username === username); // Might need slight delay in real network, but Snapshot should catch it
        // For now, we wait for snapshot or optimistically set if snapshot is fast enough
        playSound('success');
        return true;
      } else {
        alert("Username taken or error.");
        playSound('error');
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    playSound('pop');
    setState(prev => ({ ...prev, currentUser: null }));
  };

  // --- Economy Handlers ---

  const updateBalance = (newBalance: number) => {
    if (!state.currentUser) return;
    
    // Optimistic Update
    const updatedUser = { ...state.currentUser, balance: newBalance };
    setState(prev => ({ ...prev, currentUser: updatedUser }));

    // Debounced DB Write
    if (balanceSyncRef.current.timeout) clearTimeout(balanceSyncRef.current.timeout);
    balanceSyncRef.current.balance = newBalance;
    balanceSyncRef.current.timeout = setTimeout(() => {
      apiUpdateBalance(state.currentUser!.username, newBalance);
    }, 1000);
  };

  // Primary Market (Minting)
  const mintGift = async (prototypeId: string) => {
    if (!state.currentUser) return;
    const proto = state.giftPrototypes.find(p => p.id === prototypeId);
    if (!proto) return;
    
    if (proto.currentSupply >= proto.maxSupply) {
      alert("Sold out!");
      playSound('error');
      return;
    }

    // Optimistic check, real check in transaction
    if (state.currentUser.balance < proto.basePrice) {
      alert("Insufficient TON balance!");
      playSound('error');
      return;
    }

    const success = await apiMintGift(state.currentUser.username, prototypeId);
    if (success) {
      playSound('success');
    } else {
      alert("Minting failed. Please try again.");
      playSound('error');
    }
  };

  // Secondary Market (P2P)
  const openSellModal = (uuid: string) => {
    setSellModal({ isOpen: true, itemId: uuid });
    setSellPrice('1000'); // Reset to default
    playSound('click');
  };

  const handleConfirmSell = async () => {
    if (!sellModal.itemId) return;
    const price = parseInt(sellPrice);
    if (isNaN(price) || price <= 0) {
      alert("Invalid price");
      return;
    }

    await apiListForSale(sellModal.itemId, price);
    playSound('click');
    setSellModal({ isOpen: false, itemId: null });
  };

  const unlistAsset = async (uuid: string) => {
    if(!confirm("Remove this item from the market? It will return to your inventory.")) return;
    await apiUnlist(uuid);
    playSound('click');
  };

  const buySecondaryGift = async (uuid: string) => {
    if (!state.currentUser) return;
    
    try {
      const success = await apiBuySecondary(state.currentUser.username, uuid);
      if (success) {
        playSound('success');
        alert("Purchase successful!");
      }
    } catch (e: any) {
      playSound('error');
      alert(`Purchase failed: ${e}`);
    }
  };

  // --- Admin Actions Wrapper ---
  const adminActions = {
    updateBalance: apiUpdateBalance,
    updateGiftPrototype: apiUpdatePrototype,
    createGiftPrototype: apiUpdatePrototype, // Same logic (upsert)
    grantGift: apiAdminGrantGift
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
      </div>
    );
  }

  if (!state.currentUser) {
    return <AuthScreen onLogin={login} onRegister={register} users={state.users} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-black text-white pb-24 md:pb-0 relative">
        <Navbar user={state.currentUser} onLogout={logout} />
        
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<Clicker user={state.currentUser} onUpdateBalance={updateBalance} />} />
            <Route path="/market" element={
              <Marketplace 
                state={state} 
                onMint={mintGift} 
                onBuySecondary={buySecondaryGift} 
                onUnlist={unlistAsset}
              />
            } />
            <Route path="/profile" element={
              <Profile 
                state={state} 
                onList={openSellModal} 
                onUnlist={unlistAsset} 
              />
            } />
            <Route path="/admin" element={
              state.currentUser.isAdmin 
                ? <AdminDashboard state={state} updateState={setState} actions={adminActions} /> 
                : <Navigate to="/" />
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1c1c1e]/90 backdrop-blur-lg border-t border-[#2c2c2e] p-4 flex justify-around z-50">
          <MobileLink to="/" icon={<Hammer />} label="Mine" />
          <MobileLink to="/market" icon={<LayoutGrid />} label="Market" />
          <MobileLink to="/profile" icon={<UserIcon />} label="Profile" />
          {state.currentUser.isAdmin && <MobileLink to="/admin" icon={<ShieldCheck />} label="Admin" />}
        </div>

        {/* Sell Modal */}
        {sellModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-2xl w-full max-w-sm space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-white">List for Sale</h3>
                 <button onClick={() => setSellModal({ isOpen: false, itemId: null })} className="text-gray-500 hover:text-white">
                   <X size={24} />
                 </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Set Price (TON)</label>
                <Input 
                  type="number" 
                  value={sellPrice} 
                  onChange={(e) => setSellPrice(e.target.value)}
                  autoFocus
                  min="1"
                  className="text-2xl font-mono text-center py-4"
                />
                <p className="text-xs text-center text-gray-500">5% service fee included</p>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 py-3" onClick={handleConfirmSell}>Confirm Listing</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </HashRouter>
  );
}

// --- Sub Components ---

const Navbar = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  return (
    <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-[#2c2c2e]">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2" onClick={() => playSound('pop')}>
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold">F</div>
          <span className="font-bold text-xl tracking-tight">Fragment<span className="text-blue-400">Clone</span></span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/">Miner</NavLink>
          <NavLink to="/market">Marketplace</NavLink>
          <NavLink to="/profile">My Assets</NavLink>
          {user.isAdmin && <NavLink to="/admin" className="text-purple-400">Admin</NavLink>}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-white">{user.username}</span>
            <span className="text-xs font-mono text-blue-400">
              {/* Handle undefined balance if schema changes */}
              {(user.balance || 0).toLocaleString()} TON
            </span>
          </div>
          <Button onClick={onLogout} variant="secondary" className="p-2">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </nav>
  );
};

const AuthScreen = ({ onLogin, onRegister, users }: { onLogin: (u: string, p: string) => Promise<boolean>, onRegister: (u: string, p: string) => Promise<boolean>, users: User[] }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    setLoading(true);
    if (isRegister) {
      await onRegister(username, password);
      // If success, main component will switch view. If fail, we stay here.
    } else {
      if (!(await onLogin(username, password))) {
        alert("Invalid credentials.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Fragment<span className="text-blue-500">Clone</span></h1>
          <p className="text-gray-400">The premier marketplace for simulated assets.</p>
        </div>

        <Card className="p-8 space-y-6 bg-[#1c1c1e] border-[#2c2c2e]">
          <div className="flex border-b border-[#2c2c2e]">
            <button 
              className={`flex-1 pb-2 ${!isRegister ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`} 
              onClick={() => { setIsRegister(false); playSound('click'); }}
            >Login</button>
            <button 
              className={`flex-1 pb-2 ${isRegister ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`} 
              onClick={() => { setIsRegister(true); playSound('click'); }}
            >Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <Input 
                autoFocus 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Enter username..." 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <Input 
                type="password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter password..." 
              />
            </div>
            <Button className="w-full py-3" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mx-auto" /> : (isRegister ? 'Create Account' : 'Sign In')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

const Marketplace = ({ state, onMint, onBuySecondary, onUnlist }: { state: AppState, onMint: (id: string) => void, onBuySecondary: (id: string) => void, onUnlist: (id: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'official' | 'resale'>('official');

  const listedInstances = state.giftInstances.filter(g => g.forSalePrice && g.forSalePrice > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">Marketplace</h2>
        <p className="text-gray-400">Buy limited edition Gifts or trade with other users.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2c2c2e] pb-1">
        <button
          onClick={() => { setActiveTab('official'); playSound('click'); }}
          className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'official' ? 'bg-[#2c2c2e] text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <ShoppingBag size={16} /> Official Store
        </button>
        <button
          onClick={() => { setActiveTab('resale'); playSound('click'); }}
          className={`px-4 py-2 flex items-center gap-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'resale' ? 'bg-[#2c2c2e] text-white' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <Repeat size={16} /> Resale Market
        </button>
      </div>
      
      {activeTab === 'official' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          {state.giftPrototypes.map(proto => (
            <GiftCard 
              key={proto.id} 
              prototype={proto} 
              showPrice 
              onBuy={() => onMint(proto.id)}
            />
          ))}
        </div>
      )}

      {activeTab === 'resale' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          {listedInstances.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-[#2c2c2e] rounded-xl">
              No items currently for sale by users.
            </div>
          ) : (
            listedInstances.map(instance => {
              const proto = state.giftPrototypes.find(p => p.id === instance.prototypeId);
              if(!proto) return null;
              const isOwner = instance.ownerUsername === state.currentUser?.username;
              return (
                <GiftCard 
                  key={instance.uuid} 
                  prototype={proto} 
                  instance={instance}
                  isOwner={isOwner}
                  onBuy={() => onBuySecondary(instance.uuid)}
                  onCancelSell={isOwner ? () => onUnlist(instance.uuid) : undefined}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const Profile = ({ state, onList, onUnlist }: { state: AppState, onList: (id: string) => void, onUnlist: (id: string) => void }) => {
  if (!state.currentUser) return null;
  
  // Filter out items that are currently for sale (User requested they disappear from inventory)
  const myGifts = state.giftInstances.filter(g => 
    g.ownerUsername === state.currentUser?.username && 
    (!g.forSalePrice || g.forSalePrice <= 0)
  );
  
  const prototypes = state.giftPrototypes;

  return (
    <div className="space-y-8">
      <Card className="p-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-[#1c1c1e] to-[#0a0a0a]">
        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-4xl font-bold">
          {state.currentUser.username[0].toUpperCase()}
        </div>
        <div className="text-center md:text-left space-y-2 flex-1">
          <h2 className="text-3xl font-bold">{state.currentUser.username}</h2>
          <p className="text-gray-400">Joined {new Date(state.currentUser.joinedAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <span className="block text-gray-400 text-sm uppercase">Balance</span>
          <span className="text-4xl font-mono text-white">{state.currentUser.balance.toLocaleString()} TON</span>
        </div>
      </Card>

      <div>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          My Collection <span className="text-sm bg-[#2c2c2e] px-2 py-1 rounded-full text-gray-400">{myGifts.length}</span>
        </h3>
        
        {myGifts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed border-[#2c2c2e] rounded-xl">
            No gifts in inventory (Check Market for listed items).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {myGifts.map(instance => {
              const proto = prototypes.find(p => p.id === instance.prototypeId);
              if (!proto) return null;
              return (
                <GiftCard 
                  key={instance.uuid} 
                  prototype={proto} 
                  instance={instance}
                  isOwner={true}
                  onSell={() => onList(instance.uuid)}
                  onCancelSell={() => onUnlist(instance.uuid)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Navigation Helpers ---

const NavLink = ({ to, children, className = '' }: { to: string, children?: React.ReactNode, className?: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} onClick={() => playSound('click')} className={`text-sm font-medium transition-colors hover:text-white ${isActive ? 'text-white' : 'text-gray-400'} ${className}`}>
      {children}
    </Link>
  );
};

const MobileLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} onClick={() => playSound('click')} className={`flex flex-col items-center gap-1 ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      <span className="text-[10px]">{label}</span>
    </Link>
  );
};
