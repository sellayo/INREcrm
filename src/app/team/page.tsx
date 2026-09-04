'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Shield, User as UserIcon, MoreVertical, Trash2, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Contact, UserData, UserRole, UserStatus } from '@/types';
import toast from 'react-hot-toast';

export default function TeamManagementPage() {
  const { role: currentUserRole } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'team' | 'leads'>('team');
  
  // Team State
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Leads State
  const [leads, setLeads] = useState<Contact[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedRep, setSelectedRep] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // --- DATA FETCHING ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as UserData[]);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (currentUserRole !== 'admin') {
      router.push('/dashboard');
      return;
    }
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [currentUserRole, router, supabase]);

  useEffect(() => {
    if (activeTab === 'leads') {
      const fetchLeads = async () => {
        setLoadingLeads(true);
        let query = supabase
          .from('contacts')
          .select('*')
          .eq('type', 'lead')
          .order('created_at', { ascending: false })
          .limit(200);

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        if (searchQuery.trim()) {
          query = query.or(`name.ilike.%${searchQuery}%,niche.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (!error && data) {
          setLeads(data as Contact[]);
        }
        setLoadingLeads(false);
      };

      // Debounce search
      const timer = setTimeout(() => {
        fetchLeads();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, searchQuery, statusFilter, supabase]);

  // --- TEAM MANAGEMENT LOGIC ---
  const handleUpdateStatus = async (id: string, newStatus: UserStatus) => {
    const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', id);
    if (!error) setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
  };

  const handleUpdateRole = async (id: string, newRole: UserRole) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', id);
    if (!error) setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this user from the team?')) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (!error) setUsers(users.filter(u => u.id !== id));
    }
  };

  // --- LEAD DISTRIBUTION LOGIC ---
  const handleToggleSelectAll = () => {
    if (selectedLeads.length === leads.length && leads.length > 0) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(lId => lId !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedRep || selectedLeads.length === 0) return;
    setIsAssigning(true);

    const { error } = await supabase
      .from('contacts')
      .update({ assigned_sales_id: selectedRep })
      .in('id', selectedLeads);

    if (!error) {
      setLeads(leads.map(l => selectedLeads.includes(l.id) ? { ...l, assigned_sales_id: selectedRep } : l));
      setSelectedLeads([]);
      toast.success(`Successfully assigned ${selectedLeads.length} leads!`);
    } else {
      toast.error('Failed to assign leads.');
    }
    setIsAssigning(false);
  };

  if (currentUserRole !== 'admin') return null;

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');
  const salesReps = activeUsers.filter(u => u.role === 'sales');
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-8 px-4 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Management</h1>
        <p className="text-sm text-slate-500">Approve users and distribute leads</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('team')}
          className={cn(
            "pb-3 px-6 text-sm font-semibold transition-colors border-b-2 flex-1 md:flex-none",
            activeTab === 'team' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Team Members
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={cn(
            "pb-3 px-6 text-sm font-semibold transition-colors border-b-2 flex-1 md:flex-none",
            activeTab === 'leads' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Lead Distribution
        </button>
      </div>

      {activeTab === 'team' && (
        <div className="space-y-8">
          {loadingUsers ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Pending Approvals */}
              {pendingUsers.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Pending Approvals ({pendingUsers.length})
                  </h2>
                  <div className="grid gap-3">
                    <AnimatePresence>
                      {pendingUsers.map(user => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                              <UserIcon size={20} />
                            </div>
                            <div className="overflow-hidden">
                              <h3 className="font-bold text-slate-900 truncate">{user.name}</h3>
                              <p className="text-xs text-slate-500">Requested: {new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleUpdateStatus(user.id, 'rejected')}
                              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(user.id, 'approved')}
                              className="w-10 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {/* Active Team */}
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Active Team ({activeUsers.length})
                </h2>
                <div className="grid gap-3">
                  {activeUsers.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No active team members.</p>
                  ) : (
                    activeUsers.map(user => (
                      <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            user.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {user.role === 'admin' ? <Shield size={20} /> : <UserIcon size={20} />}
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-bold text-slate-900 truncate">{user.name}</h3>
                            <p className="text-xs text-slate-500">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <select
                            value={user.role || 'sales'}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="sales">Sales</option>
                            <option value="internal">Internal</option>
                            <option value="admin">Admin</option>
                          </select>
                          
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
              
              {/* Rejected Users */}
              {rejectedUsers.length > 0 && (
                <section className="opacity-60">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Rejected ({rejectedUsers.length})
                  </h2>
                  <div className="grid gap-2">
                    {rejectedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="text-sm font-medium text-slate-600">{user.name}</div>
                        <button 
                          onClick={() => handleUpdateStatus(user.id, 'approved')}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Bulk Action Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {selectedLeads.length} Selected
              </span>
              {selectedLeads.length > 0 && (
                <button onClick={() => setSelectedLeads([])} className="text-xs text-slate-500 hover:text-slate-700">Clear</button>
              )}
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                value={selectedRep}
                onChange={e => setSelectedRep(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 md:w-48"
              >
                <option value="">Select Sales Rep...</option>
                {salesReps.map(rep => (
                  <option key={rep.id} value={rep.id}>{rep.name}</option>
                ))}
              </select>
              <button 
                onClick={handleBulkAssign}
                disabled={isAssigning || selectedLeads.length === 0 || !selectedRep}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0 flex items-center gap-2"
              >
                {isAssigning ? 'Assigning...' : 'Assign Leads'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search leads by name or niche..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm appearance-none font-medium text-slate-700"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-12">
                      <input 
                        type="checkbox" 
                        checked={leads.length > 0 && selectedLeads.length === leads.length}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Niche</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingLeads ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">Loading leads...</td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No leads found.</td>
                    </tr>
                  ) : (
                    leads.map(lead => (
                      <tr 
                        key={lead.id} 
                        onClick={() => handleToggleSelect(lead.id)}
                        className={cn("hover:bg-slate-50 transition-colors cursor-pointer", selectedLeads.includes(lead.id) && "bg-blue-50/50")}
                      >
                        <td className="p-4">
                          <input 
                            type="checkbox" 
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => {}} 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-semibold text-slate-900">{lead.name}</td>
                        <td className="p-4 text-slate-500">{lead.niche || '-'}</td>
                        <td className="p-4">
                          <span className={cn(
                            "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider",
                            lead.status === 'new' && 'bg-blue-100 text-blue-700',
                            lead.status === 'contacted' && 'bg-purple-100 text-purple-700',
                            lead.status === 'qualified' && 'bg-amber-100 text-amber-700',
                            lead.status === 'won' && 'bg-green-100 text-green-700',
                            lead.status === 'lost' && 'bg-red-100 text-red-700'
                          )}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {lead.assigned_sales_id ? (
                            <span className="flex items-center gap-2 text-slate-600 font-medium">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                <UserIcon size={12} />
                              </div>
                              {users.find(u => u.id === lead.assigned_sales_id)?.name || 'Unknown Rep'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-slate-400 italic">
                               <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                <UserIcon size={12} />
                              </div>
                              Unassigned
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
