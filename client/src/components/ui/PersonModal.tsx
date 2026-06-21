import { CalendarDays, Heart, MapPin, X } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { formatFullDate, formatYear } from '../../utils/dateLabels';

interface Props {
  member: FamilyMember | null;
  onClose: () => void;
}

const fullName = (member: FamilyMember) => [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
const initials = (member: FamilyMember) => `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`;
const lifeStatusText = (member: FamilyMember) => {
  if (member.lifeStatus === 'pregnancy-loss') return 'Remembered with love by the family';
  if (member.lifeStatus === 'deceased' || member.isLiving === false) return 'Remembered with love';
  if (member.lifeStatus === 'unknown') return 'Life status not recorded';
  return 'Living';
};

export function PersonModal({ member, onClose }: Props) {
  if (!member) return null;
  const rememberedChild = member.lifeStatus === 'pregnancy-loss';

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-forest/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <article className="relative w-full max-w-xl overflow-hidden rounded-[1.8rem] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow" aria-label="Close details"><X size={18} /></button>
        <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
          <div className="min-h-56 bg-[#f6e9e6]">
            {member.profileImage ? (
              <img src={member.profileImage} alt={fullName(member)} className="h-full w-full object-cover" />
            ) : (
              <div className={`grid h-full min-h-56 place-items-center text-5xl font-bold ${rememberedChild ? 'bg-[#f4ded8] text-clay' : 'bg-gradient-to-br from-clay to-[#7f1d1d] text-white'}`}>
                {rememberedChild ? <Heart size={52} /> : initials(member)}
              </div>
            )}
          </div>
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-clay">{member.branch || 'Family group'}</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-ink">{fullName(member)}</h2>
            {member.nickname && <p className="mt-1 text-sm text-ink/50">Known as {member.nickname}</p>}
            <div className="my-5 grid gap-3 text-sm text-ink/65">
              {member.birthDate && <p className="flex gap-3"><CalendarDays size={17} className="text-clay" /> Born {formatFullDate(member.birthDate)}</p>}
              {member.deathDate && <p className="flex gap-3"><CalendarDays size={17} className="text-clay" /> {formatYear(member.birthDate) ? `${formatYear(member.birthDate)} - ${formatYear(member.deathDate)}` : `Died ${formatFullDate(member.deathDate)}`}</p>}
              {(member.birthPlace || member.currentLocation) && <p className="flex gap-3"><MapPin size={17} className="text-clay" /> {member.birthPlace || member.currentLocation}</p>}
              <p className="flex gap-3"><Heart size={17} className="text-clay" /> {lifeStatusText(member)}</p>
            </div>
            {member.occupation && <p className="mb-3 rounded-full bg-clay/10 px-3 py-1 text-sm font-semibold text-clay">{member.occupation}</p>}
            <p className="max-h-44 overflow-auto text-sm leading-7 text-ink/70">
              {member.biography || (rememberedChild ? 'This child is remembered with love by the family.' : 'This family story is waiting to be written.')}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
