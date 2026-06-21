import { useMemo, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Eye, Heart, Minus, MoreVertical, Plus, RotateCcw } from 'lucide-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { FamilyMember, TreeData } from '../../types';
import { familyCardDateLabel } from '../../utils/dateLabels';
import { PersonModal } from '../ui/PersonModal';

const fullName = (member: FamilyMember) => [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
const initials = (member: FamilyMember) => `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`;
const sortByName = (first: FamilyMember, second: FamilyMember) => fullName(first).localeCompare(fullName(second));
const sortByFamilyOrder = (first: FamilyMember, second: FamilyMember) => {
  const firstOrder = first.siblingOrder ?? Number.POSITIVE_INFINITY;
  const secondOrder = second.siblingOrder ?? Number.POSITIVE_INFINITY;
  if (firstOrder !== secondOrder) return firstOrder - secondOrder;

  const firstBirth = first.birthDate ? new Date(first.birthDate).getTime() : Number.POSITIVE_INFINITY;
  const secondBirth = second.birthDate ? new Date(second.birthDate).getTime() : Number.POSITIVE_INFINITY;
  if (firstBirth !== secondBirth) return firstBirth - secondBirth;

  return sortByName(first, second);
};

const sharedChildCount = (first: FamilyMember, second: FamilyMember, members: FamilyMember[]) =>
  members.filter((member) => member.parentIds.includes(first._id) && member.parentIds.includes(second._id)).length;

function PersonBranchCard({ member, onClick }: { member: FamilyMember; onClick: (member: FamilyMember) => void }) {
  const rememberedChild = member.lifeStatus === 'pregnancy-loss';

  return (
    <article className={`family-card ${rememberedChild ? 'family-card--remembered' : ''}`}>
      <div className="family-card__main">
        <span className="family-card__photo">
          {member.profileImage ? <img src={member.profileImage} alt={fullName(member)} /> : rememberedChild ? <Heart size={34} /> : initials(member)}
        </span>
        <span className="family-card__body">
          <strong>{fullName(member)}</strong>
          <small>{familyCardDateLabel(member)}</small>
        </span>
      </div>
      <div className="family-card__actions">
        <button type="button" className="family-card__view" onClick={() => onClick(member)}>
          <Eye size={14} /> View
        </button>
      </div>
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
    .sort(sortByFamilyOrder);

  const partners = owner.spouseIds
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
      <div className={`branch-family-row ${visibleChildren.length ? 'branch-family-row--has-children' : ''}`}>
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
  const roots = visibleMembers.filter((member) => !member.parentIds.some((parentId) => visibleById.has(parentId)));
  const rootIds = new Set(roots.map((member) => member._id));
  const rootCouples = roots
    .flatMap((member) =>
      member.spouseIds
        .map((spouseId) => visibleById.get(spouseId))
        .filter((spouse): spouse is FamilyMember => Boolean(spouse))
        .filter((spouse) => rootIds.has(spouse._id))
        .map((spouse) => ({
          rootA: member,
          rootB: spouse,
          score: sharedChildCount(member, spouse, visibleMembers),
        })),
    )
    .sort((first, second) => second.score - first.score || sortByName(first.rootA, second.rootA));

  const rootA = rootCouples[0]?.rootA || roots.find((member) => member.spouseIds.some((spouseId) => visibleById.has(spouseId))) || roots[0];
  if (!rootA) return { rootA: undefined, rootB: undefined, children: [] as FamilyMember[], visibleMembers };

  const rootB = rootCouples[0]?.rootB || rootA.spouseIds.map((spouseId) => visibleById.get(spouseId)).find((member): member is FamilyMember => Boolean(member));
  const selectedRootIds = new Set([rootA._id, rootB?._id].filter(Boolean) as string[]);
  const children = visibleMembers
    .filter((member) => member.parentIds.some((parentId) => selectedRootIds.has(parentId)))
    .sort(sortByFamilyOrder);

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
