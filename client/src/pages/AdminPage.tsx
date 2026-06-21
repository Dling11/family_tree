import { ArrowLeft, ImagePlus, Images, LockKeyhole, LogOut, Pencil, Plus, Search, Sprout, Trash2, UserRound, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FamilyTree } from '../components/tree/FamilyTree';
import { createDashboardImage, createFamilyGroup, createMember, deleteDashboardImage, deleteMember, hasAdminSession, loginAdmin, logoutAdmin, updateMember } from '../api';
import { useAdminDashboardImages } from '../hooks/useDashboardImages';
import { useAdminMembers } from '../hooks/useAdminMembers';
import { useFamilyGroups } from '../hooks/useFamilyGroups';
import type { DashboardImage, FamilyGroup, FamilyMember, TreeData } from '../types';

type FormState = Partial<FamilyMember> & { image?: File };
type QuickMemberDraft = Pick<FamilyMember, 'firstName' | 'lastName'> & Partial<Pick<FamilyMember, 'branch'>>;
const emptyForm: FormState = { firstName: '', lastName: '', parentIds: [], spouseIds: [], isLiving: true };
const fullName = (member: FamilyMember) => `${member.firstName} ${member.lastName}`;
type AdminTab = 'tree' | 'records' | 'carousel';
type AdminMemberGroup = { id: string; members: FamilyMember[] };
const genderLabel = (gender?: FamilyMember['gender']) => {
  if (gender === 'male') return 'Male';
  if (gender === 'female') return 'Female';
  if (gender === 'non-binary') return 'Non-binary';
  if (gender === 'prefer-not-to-say') return 'Prefer not to say';
  return 'Gender not set';
};
const lifeStatusLabel = (status?: FamilyMember['lifeStatus'], isLiving?: boolean) => {
  if (status === 'pregnancy-loss') return 'Pregnancy loss / unborn child';
  if (status === 'deceased' || isLiving === false) return 'Deceased';
  if (status === 'unknown') return 'Unknown';
  return 'Living';
};

const initials = (member: FamilyMember) => `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`;
const sortMembers = (first: FamilyMember, second: FamilyMember) => fullName(first).localeCompare(fullName(second));
const pickGroupAnchor = (group: FamilyMember[]) => [...group].sort((first, second) => {
  if (first.parentIds.length !== second.parentIds.length) return second.parentIds.length - first.parentIds.length;
  if ((first.branch === 'Rodriguez') !== (second.branch === 'Rodriguez')) return first.branch === 'Rodriguez' ? -1 : 1;
  return sortMembers(first, second);
})[0]!;

function MemberAvatar({ member }: { member: FamilyMember }) {
  return (
    <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-moss font-display text-white">
      {member.profileImage ? <img src={member.profileImage} className="h-full w-full object-cover" /> : initials(member)}
    </div>
  );
}

function MemberForm({ members, familyGroups, initial, preset, onClose, onSaved, onFamilyGroupSaved }: { members: FamilyMember[]; familyGroups: FamilyGroup[]; initial?: FamilyMember; preset?: FormState; onClose: () => void; onSaved: () => void; onFamilyGroupSaved: () => void }) {
  const [form, setForm] = useState<FormState>(initial || preset || emptyForm);
  const [availableMembers, setAvailableMembers] = useState(members);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(initial?.profileImage || '');
  const [childQuery, setChildQuery] = useState('');
  const [connectingChild, setConnectingChild] = useState(false);
  const set = (field: keyof FormState, value: unknown) => setForm((current) => ({ ...current, [field]: value }));
  const recordedChildren = useMemo(
    () => initial ? availableMembers.filter((member) => member.parentIds.includes(initial._id)).sort(sortMembers) : [],
    [availableMembers, initial],
  );
  const childOptions = useMemo(() => {
    if (!initial) return [];
    const search = childQuery.trim().toLowerCase();
    if (!search) return [];
    return availableMembers
      .filter((member) => member._id !== initial._id)
      .filter((member) => !member.parentIds.includes(initial._id))
      .filter((member) => !search || fullName(member).toLowerCase().includes(search) || member.branch?.toLowerCase().includes(search))
      .sort(sortMembers)
      .slice(0, 8);
  }, [availableMembers, childQuery, initial]);

  useEffect(() => {
    setAvailableMembers(members);
  }, [members]);

  useEffect(() => {
    if (!form.image) {
      setImagePreview(initial?.profileImage || '');
      return;
    }

    const previewUrl = URL.createObjectURL(form.image);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.image, initial?.profileImage]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = new FormData();
    const normalizedForm = {
      ...form,
      isLiving: form.lifeStatus ? form.lifeStatus === 'living' : form.isLiving,
    };
    Object.entries(normalizedForm).forEach(([key, value]) => {
      if (key === 'image' && value instanceof File) payload.append('image', value);
      else if (['parentIds', 'spouseIds'].includes(key)) payload.append(key, JSON.stringify(value || []));
      else if (value !== undefined && value !== null) payload.append(key, String(value));
    });
    try {
      if (initial) await updateMember(initial._id, payload);
      else await createMember(payload);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const createRelatedMember = async (draft: QuickMemberDraft, relation: 'parentIds' | 'spouseIds') => {
    const payload = new FormData();
    payload.append('firstName', draft.firstName);
    payload.append('lastName', draft.lastName);
    payload.append('isLiving', 'true');
    if (draft.branch) payload.append('branch', draft.branch);

    const member = await createMember(payload);
    setAvailableMembers((current) => [...current, member]);
    setForm((current) => ({ ...current, [relation]: [...(current[relation] || []), member._id] }));
    return member;
  };

  const addFamilyGroup = async (name: string) => {
    const group = await createFamilyGroup(name);
    set('branch', group.name);
    onFamilyGroupSaved();
    return group;
  };

  const connectExistingChild = async (child: FamilyMember) => {
    if (!initial || child.parentIds.includes(initial._id)) return;
    setConnectingChild(true);
    const payload = new FormData();
    payload.append('parentIds', JSON.stringify([...child.parentIds, initial._id]));
    payload.append('spouseIds', JSON.stringify(child.spouseIds || []));
    payload.append('isLiving', String(child.isLiving ?? true));
    if (child.lifeStatus) payload.append('lifeStatus', child.lifeStatus);
    payload.append('featured', String(child.featured ?? false));
    payload.append('hideInTree', String(child.hideInTree ?? false));
    try {
      const updated = await updateMember(child._id, payload);
      setAvailableMembers((current) => current.map((member) => member._id === updated._id ? updated : member));
      setChildQuery('');
    } finally {
      setConnectingChild(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-forest/45 backdrop-blur-sm" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto bg-cream p-6 shadow-2xl sm:p-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-ink/45">{initial ? 'Update member' : 'New member'}</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">{initial ? 'Edit family member' : 'Add family member'}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-white"><X /></button>
        </div>
        <label className="mb-7 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-moss/40 bg-white/50 p-5">
          <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-sand text-forest">
            {imagePreview ? <img src={imagePreview} alt="Profile preview" className="h-full w-full object-cover" /> : <ImagePlus />}
          </span>
          <span><strong className="block text-sm text-ink">Upload profile photo</strong><small className="text-ink/45">{form.image?.name || 'JPG, PNG or WebP up to 5MB'}</small></span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => set('image', e.target.files?.[0])} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" required value={form.firstName} placeholder="Example: Rowell" onChange={(v) => set('firstName', v)} />
          <Field label="Last name" required value={form.lastName} placeholder="Example: Delrosario" onChange={(v) => set('lastName', v)} />
          <Field label="Middle name" value={form.middleName} placeholder="Optional, example: Rodriguez" onChange={(v) => set('middleName', v)} />
          <Field label="Nickname" value={form.nickname} placeholder="Optional, example: Weng" onChange={(v) => set('nickname', v)} />
          <GenderPicker value={form.gender || ''} onChange={(value) => set('gender', value)} />
          <LifeStatusPicker
            value={form.lifeStatus || (form.isLiving === false ? 'deceased' : 'living')}
            onChange={(value) => {
              set('lifeStatus', value);
              set('isLiving', value === 'living');
            }}
          />
          <Field label="Sibling order" type="number" value={form.siblingOrder ?? ''} placeholder="Example: 1 for eldest" onChange={(v) => set('siblingOrder', v)} />
          <Field label="Birth date" type="date" value={form.birthDate?.slice(0, 10)} onChange={(v) => set('birthDate', v)} />
          <Field label="Death date" type="date" value={form.deathDate?.slice(0, 10)} onChange={(v) => set('deathDate', v)} />
          <Field label="Birth place" value={form.birthPlace} placeholder="Example: Malaang, Philippines" onChange={(v) => set('birthPlace', v)} />
          <Field label="Occupation" value={form.occupation} placeholder="Example: Teacher, Farmer, Nurse" onChange={(v) => set('occupation', v)} />
          <FamilyGroupPicker value={form.branch || ''} groups={familyGroups} onChange={(value) => set('branch', value)} onCreate={addFamilyGroup} />
        </div>
        <div className="mt-6 rounded-3xl border border-clay/15 bg-white/65 p-5">
          <p className="text-sm font-bold text-forest">How this person connects</p>
          <p className="mt-1 text-xs leading-5 text-ink/50">
            Pick parents for the downward family line. Pick spouses or partners for side-by-side connections.
            For a step-parent, add them as the parent's spouse, but only choose them as a parent if you want their line connected to the child too.
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <RelationPicker
              label="Parents"
              description="Mother, father, or any parent you want shown above this person."
              members={availableMembers}
              selected={form.parentIds || []}
              currentId={initial?._id}
              onChange={(ids) => set('parentIds', ids)}
              quickDefaults={{ branch: form.branch }}
              onCreate={(draft) => createRelatedMember(draft, 'parentIds')}
            />
            <RelationPicker
              label="Spouses / partners"
              description="Husband, wife, partner, or step-parent relationship to this person's parent."
              members={availableMembers}
              selected={form.spouseIds || []}
              currentId={initial?._id}
              onChange={(ids) => set('spouseIds', ids)}
              quickDefaults={{ branch: form.branch }}
              onCreate={(draft) => createRelatedMember(draft, 'spouseIds')}
            />
          </div>
          {initial && (
            <div className="mt-5 rounded-2xl border border-forest/10 bg-white/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">Children recorded under this person</p>
                  <p className="mt-1 text-xs leading-5 text-ink/45">
                    These are found from child records where this person is selected as a parent.
                  </p>
                </div>
                <span className="rounded-full bg-clay/10 px-2.5 py-1 text-xs font-bold text-clay">{recordedChildren.length}</span>
              </div>
              {recordedChildren.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recordedChildren.map((child) => (
                    <span key={child._id} className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70">
                      {fullName(child)}{child.hideInTree ? ' - hidden' : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-2xl border border-dashed border-forest/15 bg-cream/70 px-4 py-4 text-center text-xs text-ink/40">
                  No children are connected yet.
                </p>
              )}
              <div className="mt-4 rounded-2xl bg-cream/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-ink/40">Add existing child</p>
                <input
                  className="admin-input mt-3"
                  value={childQuery}
                  onChange={(event) => setChildQuery(event.target.value)}
                  placeholder="Search existing person, example: Rowell"
                />
                <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                  {childOptions.map((child) => (
                    <button
                      key={child._id}
                      type="button"
                      onClick={() => connectExistingChild(child)}
                      disabled={connectingChild}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-forest/10 bg-white px-4 py-3 text-left text-sm text-ink/70 hover:border-clay/30 disabled:cursor-wait disabled:opacity-60"
                    >
                      <span>
                        <strong className="block text-ink">{fullName(child)}</strong>
                        <small className="text-ink/40">{child.branch || 'No family group'}</small>
                      </span>
                      <span className="rounded-full bg-clay px-3 py-1 text-xs font-bold text-white">Add</span>
                    </button>
                  ))}
                  {!childOptions.length && (
                    <p className="rounded-2xl border border-dashed border-forest/15 bg-white/60 px-4 py-4 text-center text-xs text-ink/40">
                      {childQuery.trim() ? 'No available existing person found.' : 'Search first before selecting a child.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <label className="mt-5 block text-sm font-semibold text-ink">Biography<textarea value={form.biography || ''} onChange={(e) => set('biography', e.target.value)} rows={5} className="admin-input mt-2 resize-none" placeholder="Add short memories, family notes, or important life details..." /></label>
        <div className="mt-5 grid gap-3 rounded-2xl bg-white/60 p-4 text-sm text-ink">
          <label className="flex items-center gap-3"><input type="checkbox" checked={form.isLiving ?? true} onChange={(e) => { set('isLiving', e.target.checked); set('lifeStatus', e.target.checked ? 'living' : 'deceased'); }} /> This person is living</label>
          <label className="flex items-start gap-3">
            <input className="mt-1" type="checkbox" checked={form.hideInTree ?? false} onChange={(e) => set('hideInTree', e.target.checked)} />
            <span><strong className="block font-semibold">Hide card from public tree</strong><small className="text-ink/45">Use this for a parent you want stored in records but not shown as a visible card.</small></span>
          </label>
        </div>
        <div className="mt-8 flex justify-end gap-3"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button className="button-primary" disabled={saving}>{saving ? 'Saving...' : 'Save member'}</button></div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder }: { label: string; value: unknown; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="text-sm font-semibold text-ink">{label}<input className="admin-input mt-2" type={type} required={required} placeholder={placeholder} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} /></label>;
}

function GenderPicker({ value, onChange }: { value: string; onChange: (value: FamilyMember['gender'] | '') => void }) {
  return (
    <label className="text-sm font-semibold text-ink">
      Gender
      <select className="admin-input mt-2" value={value} onChange={(event) => onChange(event.target.value as FamilyMember['gender'] | '')}>
        <option value="">Select gender...</option>
        <option value="female">Female</option>
        <option value="male">Male</option>
        <option value="non-binary">Non-binary</option>
        <option value="prefer-not-to-say">Prefer not to say</option>
      </select>
    </label>
  );
}

function LifeStatusPicker({ value, onChange }: { value: string; onChange: (value: FamilyMember['lifeStatus']) => void }) {
  return (
    <label className="text-sm font-semibold text-ink">
      Life status
      <select className="admin-input mt-2" value={value} onChange={(event) => onChange(event.target.value as FamilyMember['lifeStatus'])}>
        <option value="living">Living</option>
        <option value="deceased">Deceased</option>
        <option value="pregnancy-loss">Pregnancy loss / unborn child</option>
        <option value="unknown">Unknown</option>
      </select>
    </label>
  );
}

function FamilyGroupPicker({ value, groups, onChange, onCreate }: { value: string; groups: FamilyGroup[]; onChange: (value: string) => void; onCreate: (name: string) => Promise<FamilyGroup> }) {
  const [newGroup, setNewGroup] = useState('');
  const [creating, setCreating] = useState(false);

  const createGroup = async () => {
    if (!newGroup.trim()) return;
    setCreating(true);
    try {
      const group = await onCreate(newGroup.trim());
      onChange(group.name);
      setNewGroup('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="text-sm font-semibold text-ink">
      <label>Family group</label>
      <select className="admin-input mt-2" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select family group...</option>
        {groups.map((group) => <option key={group._id} value={group.name}>{group.name}</option>)}
      </select>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input className="admin-input" value={newGroup} onChange={(event) => setNewGroup(event.target.value)} placeholder="Create group, example: Delrosario" />
        <button type="button" onClick={createGroup} disabled={creating || !newGroup.trim()} className="rounded-xl bg-clay px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {creating ? 'Adding...' : 'Add group'}
        </button>
      </div>
    </div>
  );
}

function RelationPicker({
  label,
  description,
  members,
  selected,
  currentId,
  onChange,
  quickDefaults,
  onCreate,
}: {
  label: string;
  description: string;
  members: FamilyMember[];
  selected: string[];
  currentId?: string;
  onChange: (ids: string[]) => void;
  quickDefaults?: Partial<Pick<FamilyMember, 'branch'>>;
  onCreate?: (draft: QuickMemberDraft) => Promise<FamilyMember>;
}) {
  const [query, setQuery] = useState('');
  const [quickFirstName, setQuickFirstName] = useState('');
  const [quickLastName, setQuickLastName] = useState('');
  const [creating, setCreating] = useState(false);
  const selectedSet = new Set(selected);
  const search = query.trim().toLowerCase();
  const options = search
    ? members
      .filter((member) => member._id !== currentId)
      .filter((member) => fullName(member).toLowerCase().includes(search) || member.branch?.toLowerCase().includes(search))
      .slice(0, 12)
    : [];
  const selectedMembers = members.filter((member) => selectedSet.has(member._id));

  const toggle = (memberId: string) => {
    if (selectedSet.has(memberId)) onChange(selected.filter((id) => id !== memberId));
    else onChange([...selected, memberId]);
  };
  const relationName = label.toLowerCase().includes('parent') ? 'parent' : 'spouse or partner';
  const createQuickMember = async () => {
    if (!quickFirstName.trim() || !quickLastName.trim() || !onCreate) return;
    setCreating(true);
    try {
      const member = await onCreate({
        firstName: quickFirstName.trim(),
        lastName: quickLastName.trim(),
        branch: quickDefaults?.branch,
      });
      setQuery(fullName(member));
      setQuickFirstName('');
      setQuickLastName('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">{label}</p>
          <p className="mt-1 text-xs leading-5 text-ink/45">{description}</p>
        </div>
        {!!selected.length && <span className="rounded-full bg-clay/10 px-2.5 py-1 text-xs font-bold text-clay">{selected.length}</span>}
      </div>
      {!!selectedMembers.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <button key={member._id} type="button" onClick={() => toggle(member._id)} className="rounded-full bg-clay px-3 py-1 text-xs font-semibold text-white">
              {fullName(member)} x
            </button>
          ))}
        </div>
      )}
      <input className="admin-input mt-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}...`} />
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
        {options.map((member) => {
          const checked = selectedSet.has(member._id);
          return (
            <button
              key={member._id}
              type="button"
              onClick={() => toggle(member._id)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${checked ? 'border-clay bg-clay/10 text-forest' : 'border-forest/10 bg-white text-ink/65 hover:border-clay/30'}`}
            >
              <span>
                <strong className="block text-ink">{fullName(member)}</strong>
                <small className="text-ink/40">{member.branch || 'No family group'}</small>
              </span>
              <span className={`grid size-5 place-items-center rounded-full border text-[10px] font-bold ${checked ? 'border-clay bg-clay text-white' : 'border-forest/20 text-transparent'}`}>{checked ? 'OK' : ''}</span>
            </button>
          );
        })}
        {!options.length && (
          <p className="rounded-2xl border border-dashed border-forest/15 bg-white/60 px-4 py-5 text-center text-xs text-ink/40">
            {search ? 'No matching family member found.' : 'Search first before selecting a connection.'}
          </p>
        )}
      </div>
      {onCreate && (
        <div className="mt-4 rounded-2xl border border-dashed border-clay/25 bg-white/70 p-4">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-ink/40">Not listed?</p>
          <p className="mt-1 text-sm font-semibold text-ink">Create a new {relationName}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className="admin-input" value={quickFirstName} onChange={(event) => setQuickFirstName(event.target.value)} placeholder="First name" />
            <input className="admin-input" value={quickLastName} onChange={(event) => setQuickLastName(event.target.value)} placeholder="Last name" />
          </div>
          <button
            type="button"
            onClick={createQuickMember}
            disabled={creating || !quickFirstName.trim() || !quickLastName.trim()}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-clay px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Creating...' : `Create and select ${relationName}`}
          </button>
        </div>
      )}
    </div>
  );
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await loginAdmin(username, password);
      onAuthenticated();
    } catch {
      setError('The username or password is incorrect.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login min-h-screen">
      <div className="absolute left-5 top-5 z-10 lg:left-8 lg:top-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-forest/65 hover:text-forest"><ArrowLeft size={17} /> Back to family tree</Link>
      </div>
      <main className="relative z-[1] mx-auto grid min-h-screen max-w-7xl place-items-center px-5 py-24 lg:grid-cols-2 lg:gap-20">
        <section className="hidden max-w-xl lg:block">
          <p className="eyebrow">Private family workspace</p>
          <h1 className="mt-5 font-display text-6xl leading-[1.02] text-forest">Preserve every name, photograph, and story.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-ink/60">The public family tree stays open for everyone. This private space is where trusted family administrators grow and maintain the archive.</p>
        </section>
        <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] border border-forest/10 bg-white/85 p-7 shadow-2xl shadow-forest/10 backdrop-blur-xl sm:p-10">
          <span className="grid size-14 place-items-center rounded-2xl bg-forest text-cream shadow-lg shadow-forest/20"><LockKeyhole size={24} /></span>
          <p className="eyebrow mt-7">Administrator access</p>
          <h2 className="mt-2 font-display text-4xl text-forest">Welcome back.</h2>
          <p className="mt-3 text-sm leading-6 text-ink/50">Sign in to manage family members and their connections.</p>
          <label className="mt-8 block text-sm font-semibold text-forest">Username
            <span className="admin-login__field mt-2"><UserRound size={18} /><input autoFocus required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></span>
          </label>
          <label className="mt-5 block text-sm font-semibold text-forest">Password
            <span className="admin-login__field mt-2"><LockKeyhole size={18} /><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></span>
          </label>
          {error && <p className="mt-4 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>}
          <button className="button-primary mt-7 w-full" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in to admin'}</button>
          <p className="mt-6 text-center text-xs text-ink/35">Family records are private. Keep your credentials secure.</p>
        </form>
      </main>
    </div>
  );
}

function DashboardImageManager({ images, onSaved }: { images: DashboardImage[]; onSaved: () => void }) {
  const [title, setTitle] = useState('Rodriguez Family');
  const [caption, setCaption] = useState('Rodriguez family photo.');
  const [sortOrder, setSortOrder] = useState(0);
  const [image, setImage] = useState<File | undefined>();
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!image) return;
    setSaving(true);
    const form = new FormData();
    form.append('title', title);
    form.append('caption', caption);
    form.append('sortOrder', String(sortOrder));
    form.append('image', image);
    try {
      await createDashboardImage(form);
      setImage(undefined);
      setSortOrder((value) => value + 1);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: DashboardImage) => {
    if (!confirm(`Remove "${item.title}" from the landing carousel?`)) return;
    await deleteDashboardImage(item._id);
    onSaved();
  };

  return (
    <section className="mb-12 overflow-hidden rounded-[2rem] border border-forest/10 bg-white shadow-sm">
      <div className="grid gap-8 p-6 lg:grid-cols-[.9fr_1.1fr] lg:p-8">
        <div>
          <p className="eyebrow">Landing carousel</p>
          <h2 className="mt-2 font-display text-3xl text-forest">Dashboard photos</h2>
          <p className="mt-2 text-sm leading-6 text-ink/50">Upload Rodriguez family photos for the homepage. They are stored in Cloudinary under <strong>kinroot/dashboard-carousel</strong>.</p>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <Field label="Image title" required value={title} onChange={setTitle} />
            <label className="text-sm font-semibold text-forest">Caption<textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={3} className="admin-input mt-2 resize-none" /></label>
            <Field label="Sort order" type="number" value={sortOrder} onChange={(value) => setSortOrder(Number(value))} />
            <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-moss/40 bg-cream/70 p-5">
              <span className="grid size-12 place-items-center rounded-xl bg-sand text-forest"><ImagePlus /></span>
              <span><strong className="block text-sm">Upload carousel image</strong><small className="text-ink/45">{image?.name || 'JPG, PNG or WebP up to 5MB'}</small></span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setImage(event.target.files?.[0])} />
            </label>
            <button className="button-primary" disabled={!image || saving}>{saving ? 'Uploading...' : 'Add carousel photo'}</button>
          </form>
        </div>
        <div className="grid gap-4">
          {images.map((item) => (
            <article key={item._id} className="grid gap-4 rounded-3xl border border-forest/10 bg-cream/60 p-4 sm:grid-cols-[160px_1fr_auto] sm:items-center">
              <img src={item.imageUrl} alt={item.title} className="h-32 w-full rounded-2xl object-cover sm:w-40" />
              <div>
                <strong className="block text-forest">{item.title}</strong>
                <p className="mt-1 line-clamp-2 text-sm text-ink/50">{item.caption || 'No caption'}</p>
                <small className="mt-2 block text-ink/35">Order {item.sortOrder ?? 0}</small>
              </div>
              <button onClick={() => remove(item)} className="admin-icon text-clay" aria-label="Delete carousel image"><Trash2 size={16} /></button>
            </article>
          ))}
          {!images.length && (
            <div className="grid min-h-60 place-items-center rounded-3xl border border-dashed border-forest/15 bg-cream/60 text-center text-sm text-ink/45">
              <span><Images className="mx-auto mb-3 text-clay" />No uploaded carousel photos yet. The public page uses the local Rodriguez clan image as fallback.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { members, error, reload } = useAdminMembers(onLogout);
  const { images: dashboardImages, reload: reloadDashboardImages } = useAdminDashboardImages();
  const { groups: familyGroups, reload: reloadFamilyGroups } = useFamilyGroups(onLogout);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<FamilyMember | null | undefined>();
  const [preset, setPreset] = useState<FormState | undefined>();
  const [activeTab, setActiveTab] = useState<AdminTab>('tree');
  const memberById = useMemo(() => new Map(members.map((member) => [member._id, member])), [members]);
  const adminTree = useMemo<TreeData>(() => {
    const spouseKeys = new Set<string>();
    return {
      members,
      edges: [
        ...members.flatMap((member) => member.parentIds.map((parentId) => ({ id: `parent-${parentId}-${member._id}`, source: parentId, target: member._id, type: 'parent' as const }))),
        ...members.flatMap((member) => member.spouseIds.flatMap((spouseId) => {
          const pair = [member._id, spouseId].sort();
          const key = pair.join('-');
          if (spouseKeys.has(key)) return [];
          spouseKeys.add(key);
          return [{ id: `spouse-${key}`, source: pair[0]!, target: pair[1]!, type: 'spouse' as const }];
        })),
      ],
    };
  }, [members]);
  const groupedMembers = useMemo(() => {
    const used = new Set<string>();
    const groups: AdminMemberGroup[] = [];

    members.forEach((member) => {
      if (used.has(member._id)) return;
      const partners = member.spouseIds.map((spouseId) => memberById.get(spouseId)).filter((spouse): spouse is FamilyMember => Boolean(spouse));
      const groupMembers = [member, ...partners].filter((item, index, all) => all.findIndex((match) => match._id === item._id) === index);
      const anchor = pickGroupAnchor(groupMembers);
      const ordered = [anchor, ...groupMembers.filter((item) => item._id !== anchor._id).sort(sortMembers)];
      ordered.forEach((item) => used.add(item._id));
      groups.push({ id: ordered.map((item) => item._id).sort().join('-'), members: ordered });
    });

    return groups.sort((first, second) => sortMembers(first.members[0]!, second.members[0]!));
  }, [memberById, members]);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return groupedMembers;
    return groupedMembers.filter((group) => group.members.some((member) => fullName(member).toLowerCase().includes(search) || member.branch?.toLowerCase().includes(search)));
  }, [groupedMembers, query]);
  const remove = async (member: FamilyMember) => {
    if (!confirm(`Remove ${member.firstName} ${member.lastName} from the family tree?`)) return;
    await deleteMember(member._id);
    reload();
  };
  const addChild = (parent: FamilyMember) => {
    const partners = parent.spouseIds.map((spouseId) => memberById.get(spouseId)).filter((spouse): spouse is FamilyMember => Boolean(spouse));
    const parentIds = partners.length === 1 ? [parent._id, partners[0]._id] : [parent._id];
    setPreset({ ...emptyForm, parentIds, branch: parent.branch || partners[0]?.branch });
    setEditing(null);
  };
  const editMember = (member: FamilyMember) => {
    setPreset(undefined);
    setEditing(member);
  };

  return (
    <div className="min-h-screen bg-[#f2f0e9]">
      <header className="border-b border-forest/10 bg-forest text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-white/10"><Sprout /></span><div><strong className="font-display text-xl">Rodriguez Admin</strong><small className="block text-[10px] uppercase tracking-[.18em] text-white/50">Family archive manager</small></div></div>
          <div className="flex items-center gap-5">
            <Link to="/" className="flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft size={16} /> Public website</Link>
            <button onClick={onLogout} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/20 hover:text-white"><LogOut size={15} /> Logout</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Admin workspace</p>
            <h1 className="mt-2 font-display text-4xl text-forest">Manage the Rodriguez archive</h1>
            <p className="mt-2 text-sm text-ink/50">Choose one workspace at a time so the admin page stays easier to use.</p>
          </div>
          <button className="button-primary shrink-0" onClick={() => { setPreset(undefined); setEditing(null); }}><Plus size={18} /> Add family member</button>
        </div>
        <div className="mb-8 flex flex-wrap gap-3 rounded-[1.5rem] border border-forest/10 bg-white p-2 shadow-sm">
          {[
            ['tree', 'Tree map'],
            ['records', 'Family records'],
            ['carousel', 'Landing carousel'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as AdminTab)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${activeTab === id ? 'bg-clay text-white shadow-lg shadow-clay/15' : 'text-ink/55 hover:bg-cream hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'tree' && (
          <section className="overflow-hidden rounded-[2rem] border border-forest/10 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-5 border-b border-forest/10 p-6 sm:flex-row sm:items-end lg:p-8">
              <div>
                <p className="eyebrow">Admin tree map</p>
                <h2 className="mt-2 font-display text-3xl text-forest">Edit from the family branches</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/50">
                  Use each card menu to edit a person, upload a photo, or add a child directly under that branch.
                </p>
              </div>
            </div>
            <div className="p-4 lg:p-6">
              {members.length ? (
                <FamilyTree
                  data={adminTree}
                  variant="admin"
                  mode="admin"
                  onEdit={editMember}
                  onUploadImage={editMember}
                  onAddChild={addChild}
                />
              ) : (
                <div className="tree-canvas tree-canvas--admin grid place-items-center text-white/60">No family members yet.</div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'records' && (
          <section>
            <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><p className="eyebrow">Family records</p><h2 className="mt-2 font-display text-4xl text-forest">Manage the family tree</h2><p className="mt-2 text-sm text-ink/50">Add people, preserve their stories, and connect every branch.</p></div>
            </div>
            <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
              <label className="input-shell bg-white"><Search size={18} /><input placeholder="Search records..." value={query} onChange={(e) => setQuery(e.target.value)} /></label>
              <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm text-ink/55"><Users size={18} className="text-clay" /><strong className="text-forest">{members.length}</strong> family members</div>
            </div>
            {error && <div className="mb-5 rounded-2xl border border-clay/20 bg-clay/10 p-4 text-sm text-clay">{error}</div>}
            <div className="space-y-4">
              {filtered.map((group) => (
                <article key={group.id} className="rounded-3xl border border-forest/10 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-forest/10 pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.14em] text-ink/35">{group.members.length > 1 ? 'Family unit' : 'Family member'}</p>
                      <h3 className="mt-1 text-lg font-bold text-ink">{group.members.map((member) => fullName(member)).join(' + ')}</h3>
                    </div>
                    <span className="rounded-full bg-clay/10 px-3 py-1 text-xs font-bold text-clay">{group.members.length} record{group.members.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid gap-3">
                    {group.members.map((member) => (
                      <div key={member._id} className="grid gap-4 rounded-2xl bg-cream/55 p-4 md:grid-cols-[1fr_1fr_110px_140px] md:items-center">
                        <div className="flex items-center gap-4">
                          <MemberAvatar member={member} />
                          <div><strong className="block text-ink">{fullName(member)}</strong><small className="text-ink/45">{member.branch || 'Unassigned'} branch</small></div>
                        </div>
                        <div className="text-sm text-ink/50">
                          <p>{member.occupation || 'No occupation recorded'}</p>
                          <small>
                            {genderLabel(member.gender)} • {lifeStatusLabel(member.lifeStatus, member.isLiving)} • {member.siblingOrder ? `Child order ${member.siblingOrder}` : 'Order not set'} • {member.birthDate ? new Date(member.birthDate).getFullYear() : 'Birth year unknown'}
                          </small>
                        </div>
                        <span className="text-sm text-ink/60">{member.hideInTree ? 'Hidden' : 'Visible'}</span>
                        <div className="flex gap-2">
                          <button onClick={() => addChild(member)} className="admin-icon text-clay" aria-label={`Add child under ${fullName(member)}`} title="Add child"><Plus size={16} /></button>
                          <button onClick={() => editMember(member)} className="admin-icon" aria-label={`Edit ${fullName(member)}`} title="Edit"><Pencil size={16} /></button>
                          <button onClick={() => remove(member)} className="admin-icon text-clay" aria-label={`Delete ${fullName(member)}`} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {group.members.length > 1 && (
                    <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-ink/45">
                      These people are connected as spouses or partners. Use each person's plus button when adding a child under only that person.
                    </p>
                  )}
                </article>
              ))}
              {!filtered.length && <div className="rounded-3xl border border-dashed border-forest/15 bg-white p-16 text-center text-ink/40">No family members found.</div>}
            </div>
          </section>
        )}

        {activeTab === 'carousel' && (
          <DashboardImageManager images={dashboardImages} onSaved={reloadDashboardImages} />
        )}
      </main>
      {editing !== undefined && (
        <MemberForm
          members={members}
          familyGroups={familyGroups}
          initial={editing || undefined}
          preset={preset}
          onClose={() => { setEditing(undefined); setPreset(undefined); }}
          onSaved={() => { setEditing(undefined); setPreset(undefined); reload(); reloadFamilyGroups(); }}
          onFamilyGroupSaved={reloadFamilyGroups}
        />
      )}
    </div>
  );
}

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState(hasAdminSession);
  const logout = useCallback(() => {
    logoutAdmin();
    setAuthenticated(false);
  }, []);

  return authenticated
    ? <AdminDashboard onLogout={logout} />
    : <AdminLogin onAuthenticated={() => setAuthenticated(true)} />;
}
