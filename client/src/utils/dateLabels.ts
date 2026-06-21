import type { FamilyMember } from '../types';

const toDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatFullDate = (value?: string) => {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

export const formatYear = (value?: string) => {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', timeZone: 'UTC' });
};

export const familyCardDateLabel = (member: FamilyMember) => {
  if (member.lifeStatus === 'pregnancy-loss') return 'Remembered with love';

  const bornYear = formatYear(member.birthDate);
  const diedYear = formatYear(member.deathDate);

  if (bornYear && diedYear) return `${bornYear} - ${diedYear}`;
  if (member.birthDate) return `Born ${formatFullDate(member.birthDate)}`;
  if (diedYear) return `Died ${diedYear}`;
  return 'Date not recorded';
};
