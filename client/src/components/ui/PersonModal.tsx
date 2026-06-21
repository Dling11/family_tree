import { CalendarDays, Heart, MapPin, X } from 'lucide-react';
import type { FamilyMember } from '../../types';

interface Props {
  member: FamilyMember | null;
  onClose: () => void;
}

const fullName = (member: FamilyMember) => [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
const initials = (member: FamilyMember) => `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`;

export function PersonModal({ member, onClose }: Props) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-forest/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <article className="relative w-full max-w-xl overflow-hidden rounded-[1.8rem] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow" aria-label="Close details"><X size={18} /></button>
        <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
          <div className="min-h-56 bg-[#f6e9e6]">
            {member.profileImage ? (
              <img src={member.profileImage} alt={fullName(member)} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full min-h-56 place-items-center bg-gradient-to-br from-clay to-[#7f1d1d] text-5xl font-bold text-white">
                {initials(member)}
              </div>
            )}
          </div>
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-clay">{member.branch || 'Family group'}</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-ink">{fullName(member)}</h2>
            {member.nickname && <p className="mt-1 text-sm text-ink/50">Known as {member.nickname}</p>}
            <div className="my-5 grid gap-3 text-sm text-ink/65">
              {member.birthDate && <p className="flex gap-3"><CalendarDays size={17} className="text-clay" /> Born {new Date(member.birthDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
              {(member.birthPlace || member.currentLocation) && <p className="flex gap-3"><MapPin size={17} className="text-clay" /> {member.birthPlace || member.currentLocation}</p>}
              {member.isLiving !== undefined && <p className="flex gap-3"><Heart size={17} className="text-clay" /> {member.isLiving ? 'Living' : 'Remembered with love'}</p>}
            </div>
            {member.occupation && <p className="mb-3 rounded-full bg-clay/10 px-3 py-1 text-sm font-semibold text-clay">{member.occupation}</p>}
            <p className="max-h-44 overflow-auto text-sm leading-7 text-ink/70">{member.biography || 'This family story is waiting to be written.'}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
