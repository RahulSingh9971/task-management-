'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import {
  UserCheck,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Bookmark,
  Trash2,
  Edit,
  DollarSign,
  Briefcase,
  Layers,
  X,
  Loader2
} from 'lucide-react';

export default function ClientsPage() {
  const { addToast } = useNotifications();

  // Data states
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientDetail, setSelectedClientDetail] = useState<any | null>(null);

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Search
  const [search, setSearch] = useState('');

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await api.clients.getAll();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setGst('');
    setAddress('');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (c: any) => {
    setEditingClient(c);
    setName(c.name);
    setCompany(c.company);
    setEmail(c.email);
    setPhone(c.phone || '');
    setGst(c.gst || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company || !email) {
      addToast('Name, Company, and Email are required', 'error');
      return;
    }

    const payload = { name, company, email, phone, gst, address, notes };

    try {
      if (editingClient) {
        await api.clients.update(editingClient.id, payload);
        addToast(`Client updated successfully`, 'success');
      } else {
        await api.clients.create(payload);
        addToast(`Client registered successfully`, 'success');
      }
      setModalOpen(false);
      loadClients();
      setSelectedClientDetail(null); // Clear selected details to prevent stale state
    } catch (err: any) {
      addToast(err.message || 'Failed to save client', 'error');
    }
  };

  const handleDeleteClient = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this client profile permanently?')) {
      try {
        await api.clients.delete(id);
        addToast('Client successfully deleted', 'success');
        loadClients();
        if (selectedClientDetail?.client.id === id) {
          setSelectedClientDetail(null);
        }
      } catch (err: any) {
        addToast(err.message || 'Failed to delete client', 'error');
      }
    }
  };

  const handleSelectClient = async (clientId: number) => {
    try {
      const details = await api.clients.getById(clientId);
      setSelectedClientDetail(details);
    } catch (err) {
      addToast('Error loading client profile details', 'error');
    }
  };

  const filteredClients = clients.filter(c => {
    const term = search.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.company.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-indigo-500" />
            <span>Client Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Store details of external agencies, companies, and billing details.</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow transition"
        >
          <Plus size={14} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-3 bg-card border border-card-border rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none text-foreground focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Clients list panel */}
        <div className="lg:col-span-1 bg-card border border-card-border rounded-2xl p-4 space-y-3 h-[500px] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left mb-2">Registered Accounts</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : filteredClients.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No clients logged.</p>
          ) : (
            filteredClients.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelectClient(c.id)}
                className={`p-4 border rounded-xl cursor-pointer text-left hover:border-slate-500 transition ${
                  selectedClientDetail?.client.id === c.id ? 'bg-indigo-950/20 border-indigo-500/50 shadow-sm' : 'bg-slate-950/20 border-card-border'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-foreground truncate">{c.name}</h4>
                  <div className="flex gap-1.5 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(c);
                      }}
                      className="text-slate-400 hover:text-indigo-400 p-0.5"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClient(c.id, e)}
                      className="text-slate-400 hover:text-red-400 p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-2.5">
                  <Building2 size={12} className="text-slate-500" />
                  <span>{c.company}</span>
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                  <Mail size={12} className="text-slate-500" />
                  <span>{c.email}</span>
                </p>
              </div>
            ))
          )}
        </div>

        {/* Selected client detailed profile sheet */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedClientDetail ? (
            <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-card-border rounded-2xl bg-card">
              Click a client profile card to load contract history and billing timelines.
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Profile card summary */}
              <div className="p-5 bg-card border border-card-border rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-950 text-indigo-400 text-lg font-bold">
                    {selectedClientDetail.client.name.charAt(0)}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">{selectedClientDetail.client.name}</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedClientDetail.client.company}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-500" />
                    <span className="text-foreground">{selectedClientDetail.client.email}</span>
                  </p>
                  {selectedClientDetail.client.phone && (
                    <p className="text-slate-400 flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-500" />
                      <span className="text-foreground">{selectedClientDetail.client.phone}</span>
                    </p>
                  )}
                  {selectedClientDetail.client.gst && (
                    <p className="text-slate-400 flex items-center gap-1.5">
                      <Bookmark size={14} className="text-slate-500" />
                      <span className="text-foreground font-mono">GSTIN: {selectedClientDetail.client.gst}</span>
                    </p>
                  )}
                </div>

                {selectedClientDetail.client.notes && (
                  <div className="pt-2 border-t border-card-border text-xs leading-relaxed text-slate-400">
                    <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-500 mb-1">Contract Notes</span>
                    <p>{selectedClientDetail.client.notes}</p>
                  </div>
                )}
              </div>

              {/* Active client projects */}
              <div className="p-5 bg-card border border-card-border rounded-2xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-indigo-500" />
                  <span>Associated Contracts</span>
                </h3>
                {selectedClientDetail.projects.length === 0 ? (
                  <p className="text-xs text-slate-500">No projects associated with this account.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedClientDetail.projects.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="p-3.5 bg-slate-950/20 hover:border-slate-500 border border-card-border rounded-xl transition"
                      >
                        <h4 className="text-xs font-bold text-foreground leading-normal">{p.name}</h4>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold uppercase tracking-wider mt-2.5 inline-block">
                          {p.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing paid/pending table */}
              <div className="p-5 bg-card border border-card-border rounded-2xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-indigo-500" />
                  <span>Payments Summary</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-card-border">
                        <th className="pb-2">Invoice No</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/60">
                      {selectedClientDetail.payments.map((pay: any) => (
                        <tr key={pay.id} className="text-slate-300">
                          <td className="py-2.5 font-mono">{pay.invoiceNo}</td>
                          <td className="py-2.5">{pay.date}</td>
                          <td className="py-2.5 font-bold">${pay.amount.toLocaleString()}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              pay.status === 'Paid' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                            }`}>{pay.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODAL: ADD/EDIT CLIENT
          ------------------------------------------------------------- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-card-border rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-fade-in text-left">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-foreground p-1"
            >
              <X size={20} />
            </button>

            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5 flex items-center gap-1.5 select-none">
              <UserCheck className="text-indigo-500" size={18} />
              <span>{editingClient ? 'Edit Client details' : 'Register Client'}</span>
            </h2>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Miller"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Company *</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. john@acme.com"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 123"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">GSTIN / TAX NO</label>
                  <input
                    type="text"
                    value={gst}
                    onChange={e => setGst(e.target.value)}
                    placeholder="e.g. 22AAAAA0000A1Z1"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="City, CA 94016"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Billing schedule notes, contracts index..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 text-foreground transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 select-none">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-card-border rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
