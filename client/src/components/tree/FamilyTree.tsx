import { useMemo, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Eye, Minus, MoreVertical, Plus, RotateCcw } from 'lucide-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { FamilyMember, TreeData } from '../../types';
import { PersonModal } from '../ui/PersonModal';

const fullName = (member: FamilyMember) => [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
const initials = (member: FamilyMember) => `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`;
const years = (member: FamilyMember) => {
  const born = member.birthDate ? new Date(member.birthDate).getFullYear() : '';
  const died = member.deathDate ? new Date(member.deathDate).getFullYear() : '';
  if (born && died) return `${born} - ${died}`;
  if (born) return String(born);
  if (died) return `d. ${died}`;
  return 'Year unknown';
};
const sortByName = (first: FamilyMember, second: FamilyMember) => fullName(first).localeCompare(fullName(second));

function PersonBranchCard({ member, onClick }: { member: FamilyMember; onClick: (member: FamilyMember) => void }) {
  return (
    <article className="family-card">
      <button type="button" className="family-card__main" onClick={() => onClick(member)}>
        <span className="family-card__photo">
          {member.profileImage ? <img src={member.profileImage} alt={fullName(member)} /> : initials(member)}
        </span>
        <span className="family-card__body">
          <strong>{fullName(member)}</strong>
          <small>{years(member)}</small>
        </span>
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="family-card__menu" aria-label={`Open menu for ${fullName(member)}`}>
          <MoreVertical size={16} />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="family-card-menu" sideOffset={8} align="end">
            <DropdownMenu.Item className="family-card-menu__item" onSelect={() => onClick(member)}>
              <Eye size={15} /> View details
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </article>
  );
}

function BranchUnit({ owner, members, onSelect, depth = 0 }: { owner: FamilyMember; members: FamilyMember[]; onSelect: (member: FamilyMember) => void; depth?: number }) {
  const memberById = new Map(members.map((member) => [member._id, member]));
  const children = members
    .filter((member) => member.parentIds.includes(owner._id))
    .filter((member) => member._id !== owner._id)
    .sort(sortByName);

  const coParentIds = new Set<string>(owner.spouseIds);
  children.forEach((child) => {
    child.parentIds.forEach((parentId) => {
      if (parentId !== owner._id) coParentIds.add(parentId);
    });
  });

  const partners = [...coParentIds]
    .map((partnerId) => memberById.get(partnerId))
    .filter((member): member is FamilyMember => {
      if (!member) return false;
      return member._id !== owner._id && !member.hideInTree;
    })
    .sort(sortByName);

  const childPartners = new Set(partners.map((partner) => partner._id));
  const visibleChildren = children.filter((child) => !child.hideInTree);

  return (
    <div className={`branch-unit ${depth > 0 ? 'branch-unit--nested' : ''}`}>
      <div className="branch-family-row">
        <PersonBranchCard member={owner} onClick={onSelect} />
        {partners.map((partner) => <PersonBranchCard key={partner._id} member={partner} onClick={onSelect} />)}
      </div>

      {!!visibleChildren.length && (
        <div className="branch-children">
          {visibleChildren.map((child) => {
            const hasOwnChildren = members.some((member) => member.parentIds.includes(child._id) && !member.hideInTree);
            const childHasVisiblePartner = child.spouseIds.some((spouseId) => {
              const spouse = memberById.get(spouseId);
              return spouse && !spouse.hideInTree;
            });
            const childOnlyBelongsHere = child.parentIds.every((parentId) => parentId === owner._id || childPartners.has(parentId) || memberById.get(parentId)?.hideInTree);

            if ((hasOwnChildren || childHasVisiblePartner) && childOnlyBelongsHere) {
              return <BranchUnit key={child._id} owner={child} members={members} onSelect={onSelect} depth={depth + 1} />;
            }

            return (
              <div key={child._id} className="branch-leaf">
                <PersonBranchCard member={child} onClick={onSelect} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildRootTree(data: TreeData) {
  const visibleMembers = data.members.filter((member) => !member.hideInTree);
  const visibleById = new Map(visibleMembers.map((member) => [member._id, member]));
  const roots = visibleMembers.filter((member) => !member.parentIds.some((parentId) => visibleById.has(parentId)) && member.generation === 1);
  const rootA = roots.find((member) => member.spouseIds.some((spouseId) => visibleById.has(spouseId))) || roots[0];
  if (!rootA) return { rootA: undefined, rootB: undefined, children: [] as FamilyMember[], visibleMembers };

  const rootB = rootA.spouseIds.map((spouseId) => visibleById.get(spouseId)).find((member): member is FamilyMember => Boolean(member));
  const rootIds = new Set([rootA._id, rootB?._id].filter(Boolean) as string[]);
  const children = visibleMembers
    .filter((member) => member.parentIds.some((parentId) => rootIds.has(parentId)))
    .sort(sortByName);

  return { rootA, rootB, children, visibleMembers };
}

export function FamilyTree({ data, focusId, variant = 'default' }: { data: TreeData; focusId?: string; variant?: 'default' | 'featured' }) {
  const [selected, setSelected] = useState<FamilyMember | null>(null);
  const tree = useMemo(() => buildRootTree(data), [data]);

  return (
    <>
      <div className={`tree-canvas custom-tree-canvas ${variant === 'featured' ? 'tree-canvas--featured' : ''}`} data-focus-id={focusId || undefined}>
        {tree.rootA ? (
          <TransformWrapper
            initialScale={0.86}
            minScale={0.35}
            maxScale={1.8}
            centerOnInit
            limitToBounds={false}
            smooth
            wheel={{ step: 0.012 }}
            pinch={{ step: 0.025 }}
            zoomAnimation={{ animationTime: 260, animationType: 'easeOut' }}
            velocityAnimation={{ animationTime: 220, animationType: 'easeOut' }}
            doubleClick={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="tree-zoom-controls">
                  <button type="button" onClick={() => zoomIn(0.18, 180, 'easeOut')} aria-label="Zoom in"><Plus size={16} /></button>
                  <button type="button" onClick={() => zoomOut(0.18, 180, 'easeOut')} aria-label="Zoom out"><Minus size={16} /></button>
                  <button type="button" onClick={() => resetTransform(200, 'easeOut')} aria-label="Reset zoom"><RotateCcw size={16} /></button>
                </div>
                <TransformComponent wrapperClass="tree-zoom-wrapper" contentClass="tree-zoom-content">
                  <div className="custom-tree">
                    <div className="custom-tree__roots">
                      <PersonBranchCard member={tree.rootA} onClick={setSelected} />
                      {tree.rootB && <PersonBranchCard member={tree.rootB} onClick={setSelected} />}
                    </div>

                    {!!tree.children.length && (
                      <div className="root-branches">
                        {tree.children.map((child) => (
                          <BranchUnit key={child._id} owner={child} members={tree.visibleMembers} onSelect={setSelected} />
                        ))}
                      </div>
                    )}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <div className="grid h-full place-items-center p-8 text-center text-sm text-ink/45">No visible family members yet.</div>
        )}
      </div>
      <PersonModal member={selected} onClose={() => setSelected(null)} />
    </>
  );
}
