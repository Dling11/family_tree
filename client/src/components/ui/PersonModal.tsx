import { CalendarDays, Heart, MapPin, X } from 'lucide-react';
import type { FamilyMember } from '../../types';

interface Props {
  member: FamilyMember | null;
  onClose: () => void;
}

const fullName = (member: FamilyMember) =>
  [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');

export function PersonModal({ member, onClose }: Props) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-forest/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <article className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[2rem] bg-cream shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-5 top-5 z-10 grid size-10 place-items-center rounded-full bg-white/90 shadow" aria-label="Close details"><X size={19} /></button>
        <div className="grid md:grid-cols-[230px_1fr]">
          <div className="min-h-64 bg-sand">
            {member.profileImage ? (
              <img src={member.profileImage} alt={fullName(member)} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full min-h-64 place-items-center bg-gradient-to-br from-moss to-forest font-display text-7xl text-white/80">
                {member.firstName[0]}{member.lastName[0]}
              </div>
            )}
          </div>
          <div className="p-7 md:p-9">
            <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-clay">{member.branch || 'Family'} branch</p>
            <h2 className="font-display text-4xl text-forest">{fullName(member)}</h2>
            {member.nickname && <p className="mt-1 text-sm italic text-ink/55">Known to the family as “{member.nickname}”</p>}
            <div className="my-6 space-y-3 text-sm text-ink/70">
              {member.birthDate && <p className="flex gap-3"><CalendarDays size={18} className="text-clay" /> Born {new Date(member.birthDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
              {(member.birthPlace || member.currentLocation) && <p className="flex gap-3"><MapPin size={18} className="text-clay" /> {member.birthPlace || member.currentLocation}</p>}
              {member.isLiving !== undefined && <p className="flex gap-3"><Heart size={18} className="text-clay" /> {member.isLiving ? 'Living' : 'Remembered with love'}</p>}
            </div>
            {member.occupation && <p className="mb-4 font-semibold text-forest">{member.occupation}</p>}
            <p className="leading-7 text-ink/70">{member.biography || 'This family story is waiting to be written.'}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
