import { ArrowLeft, ImagePlus, Images, LockKeyhole, LogOut, Pencil, Plus, Search, Sprout, Trash2, UserRound, Users, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createDashboardImage, createMember, deleteDashboardImage, deleteMember, hasAdminSession, loginAdmin, logoutAdmin, updateMember } from '../api';
import { useAdminDashboardImages } from '../hooks/useDashboardImages';
import { useAdminMembers } from '../hooks/useAdminMembers';
import type { DashboardImage, FamilyMember } from '../types';

type FormState = Partial<FamilyMember> & { image?: File };
const emptyForm: FormState = { firstName: '', lastName: '', parentIds: [], spouseIds: [], isLiving: true, generation: 1 };

function MemberForm({ members, initial, onClose, onSaved }: { members: FamilyMember[]; initial?: FamilyMember; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(initial || emptyForm);
  const [saving, setSaving] = useState(false);
  const set = (field: keyof FormState, value: unknown) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-forest/45 backdrop-blur-sm" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto bg-cream p-6 shadow-2xl sm:p-10">
        <div className="mb-8 flex items-center justify-between">
          <div><p className="eyebrow">{initial ? 'Update story' : 'New branch'}</p><h2 className="mt-2 font-display text-3xl text-forest">{initial ? 'Edit family member' : 'Add family member'}</h2></div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-white"><X /></button>
        </div>
        <label className="mb-7 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-moss/40 bg-white/50 p-5">
          <span className="grid size-14 place-items-center rounded-xl bg-sand text-forest"><ImagePlus /></span>
          <span><strong className="block text-sm">Upload profile photo</strong><small className="text-ink/45">{form.image?.name || 'JPG, PNG or WebP up to 5MB'}</small></span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => set('image', e.target.files?.[0])} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" required value={form.firstName} onChange={(v) => set('firstName', v)} />
          <Field label="Last name" required value={form.lastName} onChange={(v) => set('lastName', v)} />
          <Field label="Middle name" value={form.middleName} onChange={(v) => set('middleName', v)} />
          <Field label="Nickname" value={form.nickname} onChange={(v) => set('nickname', v)} />
          <Field label="Birth date" type="date" value={form.birthDate?.slice(0, 10)} onChange={(v) => set('birthDate', v)} />
          <Field label="Death date" type="date" value={form.deathDate?.slice(0, 10)} onChange={(v) => set('deathDate', v)} />
          <Field label="Birth place" value={form.birthPlace} onChange={(v) => set('birthPlace', v)} />
          <Field label="Occupation" value={form.occupation} onChange={(v) => set('occupation', v)} />
          <Field label="Family branch" value={form.branch} onChange={(v) => set('branch', v)} />
          <Field label="Generation" type="number" value={form.generation} onChange={(v) => set('generation', Number(v))} />
          <RelationSelect label="Parents" members={members} selected={form.parentIds || []} currentId={initial?._id} onChange={(ids) => set('parentIds', ids)} />
          <RelationSelect label="Spouses" members={members} selected={form.spouseIds || []} currentId={initial?._id} onChange={(ids) => set('spouseIds', ids)} />
        </div>
        <label className="mt-5 block text-sm font-semibold text-forest">Biography<textarea value={form.biography || ''} onChange={(e) => set('biography', e.target.value)} rows={5} className="admin-input mt-2 resize-none" placeholder="Share their story, memories, and milestones..." /></label>
        <label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isLiving ?? true} onChange={(e) => set('isLiving', e.target.checked)} /> This person is living</label>
        <div className="mt-8 flex justify-end gap-3"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button className="button-primary" disabled={saving}>{saving ? 'Saving...' : 'Save member'}</button></div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: unknown; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="text-sm font-semibold text-forest">{label}<input className="admin-input mt-2" type={type} required={required} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} /></label>;
}

function RelationSelect({ label, members, selected, currentId, onChange }: { label: string; members: FamilyMember[]; selected: string[]; currentId?: string; onChange: (ids: string[]) => void }) {
  return (
    <label className="text-sm font-semibold text-forest">{label}
      <select multiple className="admin-input mt-2 h-28" value={selected} onChange={(e) => onChange(Array.from(e.target.selectedOptions, (option) => option.value))}>
        {members.filter((member) => member._id !== currentId).map((member) => <option key={member._id} value={member._id}>{member.firstName} {member.lastName}</option>)}
      </select>
    </label>
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
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<FamilyMember | null | undefined>();
  const filtered = useMemo(() => members.filter((member) => `${member.firstName} ${member.lastName}`.toLowerCase().includes(query.toLowerCase())), [members, query]);
  const remove = async (member: FamilyMember) => {
    if (!confirm(`Remove ${member.firstName} ${member.lastName} from the family tree?`)) return;
    await deleteMember(member._id);
    reload();
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
        <DashboardImageManager images={dashboardImages} onSaved={reloadDashboardImages} />
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Family records</p><h1 className="mt-2 font-display text-4xl text-forest">Manage the family tree</h1><p className="mt-2 text-sm text-ink/50">Add people, preserve their stories, and connect every branch.</p></div>
          <button className="button-primary" onClick={() => setEditing(null)}><Plus size={18} /> Add family member</button>
        </div>
        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="input-shell bg-white"><Search size={18} /><input placeholder="Search records..." value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm text-ink/55"><Users size={18} className="text-clay" /><strong className="text-forest">{members.length}</strong> family members</div>
        </div>
        {error && <div className="mb-5 rounded-2xl border border-clay/20 bg-clay/10 p-4 text-sm text-clay">{error}</div>}
        <div className="overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_1fr_120px_100px] border-b border-forest/10 bg-forest/[.03] px-6 py-4 text-xs font-bold uppercase tracking-wider text-ink/40 md:grid"><span>Family member</span><span>Details</span><span>Generation</span><span>Actions</span></div>
          {filtered.map((member) => (
            <article key={member._id} className="grid gap-4 border-b border-forest/10 px-6 py-5 last:border-0 md:grid-cols-[1fr_1fr_120px_100px] md:items-center">
              <div className="flex items-center gap-4">
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-moss font-display text-white">{member.profileImage ? <img src={member.profileImage} className="h-full w-full object-cover" /> : `${member.firstName[0]}${member.lastName[0]}`}</div>
                <div><strong className="block text-forest">{member.firstName} {member.lastName}</strong><small className="text-ink/45">{member.branch || 'Unassigned'} branch</small></div>
              </div>
              <div className="text-sm text-ink/50"><p>{member.occupation || 'No occupation recorded'}</p><small>{member.birthDate ? new Date(member.birthDate).getFullYear() : 'Birth year unknown'}</small></div>
              <span className="text-sm text-ink/60">Generation {member.generation || '—'}</span>
              <div className="flex gap-2"><button onClick={() => setEditing(member)} className="admin-icon" aria-label="Edit"><Pencil size={16} /></button><button onClick={() => remove(member)} className="admin-icon text-clay" aria-label="Delete"><Trash2 size={16} /></button></div>
            </article>
          ))}
          {!filtered.length && <div className="p-16 text-center text-ink/40">No family members found.</div>}
        </div>
      </main>
      {editing !== undefined && <MemberForm members={members} initial={editing || undefined} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />}
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
