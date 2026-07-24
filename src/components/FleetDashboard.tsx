import React, { useState } from 'react';
import {
  Users,
  Plus,
  Mail,
  Shield,
  Plane,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Building,
  Key,
  Trash2,
  Download,
  Filter,
} from 'lucide-react';
import { DisplayTheme } from './Header';

export type FleetRole = 'Admin' | 'Dispatcher' | 'Pilot';

export interface FleetMember {
  id: string;
  name: string;
  email: string;
  role: FleetRole;
  assignedTailNumber?: string;
  joinedAt: string;
  status: 'Active' | 'Pending';
}

export interface AircraftTail {
  tailNumber: string; // e.g. VT-VAYU, N172SP
  aircraftType: string; // e.g. Cessna 172, King Air 350, Gulfstream G650
  assignedPic: string;
  lastBriefingIcao?: string;
  lastBriefingTime?: string;
  status: 'Airworthy' | 'In Maintenance' | 'Pre-Flight Active';
  criticalRiskCount: number;
}

interface FleetDashboardProps {
  theme: DisplayTheme;
  isOpen: boolean;
  onClose: () => void;
  onSelectTailNumber?: (tail: string) => void;
}

export const FleetDashboard: React.FC<FleetDashboardProps> = ({
  theme,
  isOpen,
  onClose,
  onSelectTailNumber,
}) => {
  const [orgName, setOrgName] = useState<string>('Skyline Aviation Operations');
  const [isEditingOrg, setIsEditingOrg] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'AIRCRAFT' | 'AUDIT_LOGS'>('MEMBERS');

  // Members state
  const [members, setMembers] = useState<FleetMember[]>([
    {
      id: 'mem-1',
      name: 'Capt. Abhishek Tiwari',
      email: 'chief.pilot@vayu.aero',
      role: 'Admin',
      assignedTailNumber: 'VT-VAYU',
      joinedAt: '2026-01-15',
      status: 'Active',
    },
    {
      id: 'mem-2',
      name: 'Dispatch Sarah Jenkins',
      email: 'dispatch@vayu.aero',
      role: 'Dispatcher',
      assignedTailNumber: 'N172SP',
      joinedAt: '2026-03-10',
      status: 'Active',
    },
    {
      id: 'mem-3',
      name: 'First Officer Rayyan Khan',
      email: 'r.khan@vayu.aero',
      role: 'Pilot',
      assignedTailNumber: 'VT-DEL',
      joinedAt: '2026-05-22',
      status: 'Active',
    },
  ]);

  // Aircraft fleet state
  const [aircraftList, setAircraftList] = useState<AircraftTail[]>([
    {
      tailNumber: 'VT-VAYU',
      aircraftType: 'Beechcraft King Air B200',
      assignedPic: 'Capt. Abhishek Tiwari',
      lastBriefingIcao: 'VIDP',
      lastBriefingTime: '2026-07-24 16:30Z',
      status: 'Pre-Flight Active',
      criticalRiskCount: 2,
    },
    {
      tailNumber: 'N172SP',
      aircraftType: 'Cessna 172S Skyhawk',
      assignedPic: 'Dispatch Sarah Jenkins',
      lastBriefingIcao: 'KJFK',
      lastBriefingTime: '2026-07-24 14:15Z',
      status: 'Airworthy',
      criticalRiskCount: 0,
    },
    {
      tailNumber: 'VT-DEL',
      aircraftType: 'Embraer Legacy 600',
      assignedPic: 'First Officer Rayyan Khan',
      lastBriefingIcao: 'VABB',
      lastBriefingTime: '2026-07-24 11:00Z',
      status: 'Airworthy',
      criticalRiskCount: 1,
    },
  ]);

  // New Invite Form
  const [newEmail, setNewEmail] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<FleetRole>('Pilot');
  const [newTail, setNewTail] = useState<string>('VT-VAYU');

  // New Aircraft Form
  const [addTailNum, setAddTailNum] = useState<string>('');
  const [addAcType, setAddAcType] = useState<string>('');

  if (!isOpen) return null;

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;

    const newMember: FleetMember = {
      id: `mem-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      assignedTailNumber: newTail,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'Active',
    };

    setMembers((prev) => [...prev, newMember]);
    setNewEmail('');
    setNewName('');
  };

  const handleAddAircraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTailNum) return;

    const newAc: AircraftTail = {
      tailNumber: addTailNum.toUpperCase(),
      aircraftType: addAcType || 'General Aviation',
      assignedPic: 'Unassigned',
      status: 'Airworthy',
      criticalRiskCount: 0,
    };

    setAircraftList((prev) => [...prev, newAc]);
    setAddTailNum('');
    setAddAcType('');
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl transition-all ${
          isNight
            ? 'bg-black border-red-900 text-red-100'
            : isDay
            ? 'bg-white border-slate-300 text-slate-900'
            : 'bg-zinc-950 border-zinc-800 text-zinc-100'
        }`}
      >
        {/* HEADER BAR */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingOrg ? (
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    onBlur={() => setIsEditingOrg(false)}
                    autoFocus
                    className="px-2 py-0.5 text-lg font-bold font-mono rounded border border-amber-500 bg-black text-amber-300 outline-none"
                  />
                ) : (
                  <h2
                    onClick={() => setIsEditingOrg(true)}
                    className="text-xl font-bold font-mono cursor-pointer hover:text-amber-400 flex items-center gap-2"
                  >
                    <span>{orgName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-normal">
                      FLEET TIER
                    </span>
                  </h2>
                )}
              </div>
              <p className="text-xs opacity-70 font-sans mt-0.5">
                FAR Part 135 / 121 Commercial Multi-Seat Management & Tail-Number Dispatch Ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-800/80 pb-3 font-mono text-xs">
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-4 py-2 rounded-xl border font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'MEMBERS'
                ? 'bg-amber-600 border-amber-400 text-white shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>PILOTS & DISPATCHERS ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('AIRCRAFT')}
            className={`px-4 py-2 rounded-xl border font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'AIRCRAFT'
                ? 'bg-amber-600 border-amber-400 text-white shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>AIRCRAFT TAIL ASSIGNMENTS ({aircraftList.length})</span>
          </button>
        </div>

        {/* TAB 1: MEMBERS MANAGEMENT */}
        {activeTab === 'MEMBERS' && (
          <div className="space-y-6">
            {/* Invite Form */}
            <form onSubmit={handleInviteMember} className="p-4 rounded-2xl border bg-zinc-900/40 border-zinc-800 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>INVITE NEW PILOT OR DISPATCHER</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                <input
                  type="text"
                  placeholder="Pilot Full Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="p-2.5 rounded-xl border bg-black border-zinc-800 outline-none text-zinc-200"
                  required
                />
                <input
                  type="email"
                  placeholder="pilot@airline.aero"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="p-2.5 rounded-xl border bg-black border-zinc-800 outline-none text-zinc-200"
                  required
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as FleetRole)}
                  className="p-2.5 rounded-xl border bg-black border-zinc-800 outline-none text-zinc-200 cursor-pointer"
                >
                  <option value="Pilot">Role: Pilot (PIC)</option>
                  <option value="Dispatcher">Role: Dispatcher</option>
                  <option value="Admin">Role: Fleet Admin</option>
                </select>
                <button
                  type="submit"
                  className="p-2.5 rounded-xl border bg-amber-600 hover:bg-amber-500 border-amber-400 text-white font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Invite</span>
                </button>
              </div>
            </form>

            {/* Members List Table */}
            <div className="border border-zinc-800 rounded-2xl overflow-hidden text-xs font-mono">
              <div className="bg-zinc-900/80 p-3 grid grid-cols-12 font-bold text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                <span className="col-span-4">Pilot Name & Email</span>
                <span className="col-span-3">Role</span>
                <span className="col-span-3">Assigned Aircraft Tail</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>
              <div className="divide-y divide-zinc-800">
                {members.map((m) => (
                  <div key={m.id} className="p-3 grid grid-cols-12 items-center hover:bg-zinc-900/40 transition">
                    <div className="col-span-4">
                      <div className="font-bold text-zinc-200">{m.name}</div>
                      <div className="text-[11px] opacity-60 font-sans">{m.email}</div>
                    </div>
                    <div className="col-span-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${
                        m.role === 'Admin' ? 'bg-purple-950 border-purple-800 text-purple-200' : m.role === 'Dispatcher' ? 'bg-sky-950 border-sky-800 text-sky-200' : 'bg-emerald-950 border-emerald-800 text-emerald-200'
                      }`}>
                        {m.role}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <button
                        onClick={() => onSelectTailNumber && onSelectTailNumber(m.assignedTailNumber || 'VT-VAYU')}
                        className="px-2 py-1 rounded bg-black border border-zinc-800 text-amber-400 font-bold hover:border-amber-500 transition cursor-pointer"
                      >
                        {m.assignedTailNumber || 'Unassigned'}
                      </button>
                    </div>
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="p-1.5 rounded-lg border border-red-900/60 text-red-400 hover:bg-red-950/60 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AIRCRAFT TAIL ASSIGNMENTS */}
        {activeTab === 'AIRCRAFT' && (
          <div className="space-y-6">
            {/* Add Aircraft Form */}
            <form onSubmit={handleAddAircraft} className="p-4 rounded-2xl border bg-zinc-900/40 border-zinc-800 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                <span>ADD AIRCRAFT TO FLEET LEDGER</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <input
                  type="text"
                  placeholder="Tail Number (e.g. VT-VAYU, N172SP)"
                  value={addTailNum}
                  onChange={(e) => setAddTailNum(e.target.value)}
                  className="p-2.5 rounded-xl border bg-black border-zinc-800 outline-none text-zinc-200 uppercase"
                  required
                />
                <input
                  type="text"
                  placeholder="Aircraft Type (e.g. King Air B200)"
                  value={addAcType}
                  onChange={(e) => setAddAcType(e.target.value)}
                  className="p-2.5 rounded-xl border bg-black border-zinc-800 outline-none text-zinc-200"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl border bg-amber-600 hover:bg-amber-500 border-amber-400 text-white font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Bind Aircraft Tail</span>
                </button>
              </div>
            </form>

            {/* Aircraft Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aircraftList.map((ac) => (
                <div key={ac.tailNumber} className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-lg font-bold font-mono text-amber-400 block">{ac.tailNumber}</span>
                      <span className="text-xs font-sans opacity-70 block">{ac.aircraftType}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                      ac.criticalRiskCount > 0 ? 'bg-red-950 border-red-800 text-red-200' : 'bg-emerald-950 border-emerald-800 text-emerald-200'
                    }`}>
                      {ac.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono space-y-1 pt-2 border-t border-zinc-800/80">
                    <div className="flex justify-between text-zinc-400">
                      <span>Assigned PIC:</span>
                      <span className="text-zinc-200 font-bold">{ac.assignedPic}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Last Briefing:</span>
                      <span className="text-amber-300 font-bold">{ac.lastBriefingIcao || 'N/A'} ({ac.lastBriefingTime || 'Never'})</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Active Hazards:</span>
                      <span className={ac.criticalRiskCount > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {ac.criticalRiskCount} Critical
                      </span>
                    </div>
                  </div>

                  {onSelectTailNumber && (
                    <button
                      onClick={() => {
                        onSelectTailNumber(ac.tailNumber);
                        onClose();
                      }}
                      className="w-full mt-2 py-1.5 rounded-xl border border-amber-500/60 bg-amber-500/10 text-amber-300 text-xs font-mono font-bold hover:bg-amber-500/20 transition cursor-pointer"
                    >
                      Bind Briefing to {ac.tailNumber}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
