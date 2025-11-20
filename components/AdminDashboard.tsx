
import React, { useState } from 'react';
import { AppState, GiftPrototype, GiftInstance, User, Rarity } from '../types';
import { Button, Input, Card, Badge } from './UI';
import { Search, Edit, Gift, Coins, Save, Trash, Plus } from 'lucide-react';
import { generateGiftMetadata } from '../services/storageService';
import { playSound } from '../services/soundService';

interface AdminProps {
  state: AppState;
  updateState: (newState: AppState) => void;
  actions: {
    updateBalance: (u: string, b: number) => Promise<void>;
    updateGiftPrototype: (g: GiftPrototype) => Promise<void>;
    createGiftPrototype: (g: GiftPrototype) => Promise<void>;
    grantGift: (u: string, pId: string) => Promise<boolean>;
  }
}

export const AdminDashboard: React.FC<AdminProps> = ({ state, actions }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'market' | 'grant'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGift, setEditingGift] = useState<GiftPrototype | null>(null);
  
  // Granting State
  const [targetUsername, setTargetUsername] = useState('');
  const [selectedGiftId, setSelectedGiftId] = useState('');

  // Actions
  const giveTon = async (username: string, currentBalance: number, amount: number) => {
    await actions.updateBalance(username, currentBalance + amount);
    playSound('coin');
  };

  const updateGift = async (gift: GiftPrototype) => {
    await actions.updateGiftPrototype(gift);
    setEditingGift(null);
    playSound('success');
  };

  const createGift = async (gift: GiftPrototype) => {
    await actions.createGiftPrototype(gift);
    playSound('success');
  };

  const grantGift = async () => {
    const targetUser = state.users.find(u => u.username === targetUsername);
    const proto = state.giftPrototypes.find(p => p.id === selectedGiftId);

    if (!targetUser) {
      alert('User not found');
      playSound('error');
      return;
    }
    if (!proto) {
      alert('Gift type not selected');
      playSound('error');
      return;
    }

    const success = await actions.grantGift(targetUsername, selectedGiftId);
    
    if (success) {
      playSound('success');
      alert(`Gift ${proto.name} granted to ${targetUser.username}!`);
      setTargetUsername('');
      setSelectedGiftId('');
    }
  };

  // Filters
  const filteredUsers = state.users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-white">Admin Console</h2>
        <div className="flex gap-2 bg-[#1c1c1e] p-1 rounded-lg border border-[#2c2c2e]">
          {(['users', 'market', 'grant'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); playSound('click'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-[#2c2c2e] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'users' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 bg-[#101010] p-2 rounded-lg border border-[#2c2c2e]">
            <Search className="text-gray-500" />
            <input 
              type="text" 
              placeholder="Search users by username..." 
              className="bg-transparent outline-none text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 border-b border-[#2c2c2e] text-sm uppercase">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {filteredUsers.map(user => (
                  <tr key={user.username} className="border-b border-[#2c2c2e]/50 hover:bg-white/5">
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                      {user.username}
                      {user.isAdmin && <Badge color="bg-purple-500/20 text-purple-400">Admin</Badge>}
                    </td>
                    <td className="py-3 px-4 font-mono">{user.balance.toLocaleString()} TON</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{new Date(user.joinedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button variant="secondary" onClick={() => giveTon(user.username, user.balance, 1000)} className="text-xs py-1">
                        +1k TON
                      </Button>
                      <Button variant="secondary" onClick={() => giveTon(user.username, user.balance, 10000)} className="text-xs py-1">
                        +10k TON
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'market' && (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.giftPrototypes.map(proto => (
                <Card key={proto.id} className="p-4 flex flex-col gap-4">
                   {editingGift?.id === proto.id ? (
                     <div className="space-y-3">
                        <Input 
                          value={editingGift.name} 
                          onChange={e => setEditingGift({...editingGift, name: e.target.value})} 
                          placeholder="Name"
                        />
                        <Input 
                          type="number"
                          value={editingGift.basePrice} 
                          onChange={e => setEditingGift({...editingGift, basePrice: Number(e.target.value)})} 
                          placeholder="Price"
                        />
                        <div className="flex gap-2">
                           <Button onClick={() => updateGift(editingGift)} className="flex-1">Save</Button>
                           <Button variant="secondary" onClick={() => { setEditingGift(null); playSound('click'); }}>Cancel</Button>
                        </div>
                     </div>
                   ) : (
                     <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-bold">{proto.name}</h3>
                          <p className="text-xs text-gray-500">ID: {proto.id}</p>
                        </div>
                        <Badge>{proto.rarity}</Badge>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-blue-400 font-mono">{proto.basePrice} TON</span>
                        <div className="text-xs text-gray-500">
                          Supply: {proto.currentSupply} / {proto.maxSupply}
                        </div>
                      </div>
                      <Button variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={() => { setEditingGift(proto); playSound('click'); }}>
                        <Edit size={14} /> Edit Price/Stats
                      </Button>
                     </>
                   )}
                </Card>
              ))}
           </div>
           
           {/* Use a button element directly here to ensure reliable clicking */}
           <button 
             className="w-full p-6 border border-dashed border-gray-600 bg-transparent hover:bg-white/5 transition-colors rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
             onClick={() => {
               createGift({
                 id: `custom-${Date.now()}`,
                 name: 'New Item',
                 basePrice: 5000,
                 maxSupply: 500,
                 currentSupply: 0,
                 rarity: Rarity.COMMON
               });
             }}
           >
               <Plus size={32} />
               <span className="text-sm font-medium">Add New Asset Type</span>
           </button>
        </div>
      )}

      {activeTab === 'grant' && (
        <Card className="p-8 max-w-2xl mx-auto space-y-6">
          <div className="flex flex-col gap-2 text-center mb-6">
            <h3 className="text-2xl font-bold text-white">Gift Distribution</h3>
            <p className="text-gray-400">Mint and send gifts directly to users (Admin Override)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Target Username</label>
              <Input 
                placeholder="e.g., admin" 
                value={targetUsername}
                onChange={e => setTargetUsername(e.target.value)}
                list="users-list"
              />
              <datalist id="users-list">
                {state.users.map(u => <option key={u.username} value={u.username} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Gift Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {state.giftPrototypes.map(proto => (
                  <button
                    key={proto.id}
                    onClick={() => { setSelectedGiftId(proto.id); playSound('click'); }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedGiftId === proto.id 
                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                        : 'border-[#2c2c2e] bg-[#1c1c1e] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-bold">{proto.name}</div>
                    <div className="text-xs opacity-60">{proto.currentSupply} / {proto.maxSupply} minted</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button className="w-full py-3 font-bold text-lg" onClick={grantGift} disabled={!targetUsername || !selectedGiftId}>
                <Gift className="inline mr-2" size={20} />
                Mint & Send Gift
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
