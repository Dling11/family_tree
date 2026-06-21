import { useMemo, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Camera, Eye, Heart, Minus, MoreVertical, Pencil, Plus, RotateCcw, UserPlus } from 'lucide-react';
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

const branchStyle = (member: FamilyMember) => {
  const branch = (member.branch || member.lastName || 'family').toLowerCase();
  let hash = 0;
  for (let index = 0; index < branch.length; index += 1) hash = branch.charCodeAt(index) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return {
    '--branch-color': `hsl(${hue} 64% 44%)`,
    '--branch-soft': `hsl(${hue} 70% 96%)`,
  } as React.CSSProperties;
};

const lifeStatusClass = (member: FamilyMember) => {
  if (member.lifeStatus === 'pregnancy-loss') return 'family-card__status--remembered';
  if (member.lifeStatus === 'unknown') return 'family-card__status--unknown';
  if (member.lifeStatus === 'deceased' || member.isLiving === false) return 'family-card__status--deceased';
  return 'family-card__status--living';
};

type TreeMode = 'public' | 'admin';
type TreeActions = {
  mode?: TreeMode;
  onEdit?: (member: FamilyMember) => void;
  onAddChild?: (member: FamilyMember) => void;
  onUploadImage?: (member: FamilyMember) => void;
};

function TreeLegend() {
  return (
    <div className="tree-legend" aria-label="Tree color legend">
      <span><i className="family-card__status--living" /> Living</span>
      <span><i className="family-card__status--deceased" /> Deceased</span>
      <span><i className="family-card__status--remembered" /> Remembered</span>
      <span><i className="family-card__status--unknown" /> Unknown</span>
    </div>
  );
}

function PersonBranchCard({ member, onClick, actions }: { member: FamilyMember; onClick: (member: FamilyMember) => void; actions?: TreeActions }) {
  const rememberedChild = member.lifeStatus === 'pregnancy-loss';
  const adminMode = actions?.mode === 'admin';

  return (
    <article className={`family-card ${rememberedChild ? 'family-card--remembered' : ''}`} style={branchStyle(member)}>
      <span className={`family-card__status ${lifeStatusClass(member)}`} title={member.lifeStatus || (member.isLiving === false ? 'deceased' : 'living')} />
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
            {adminMode && (
              <>
                <DropdownMenu.Item className="family-card-menu__item" onSelect={() => actions?.onEdit?.(member)}>
                  <Pencil size={15} /> Edit person
                </DropdownMenu.Item>
                <DropdownMenu.Item className="family-card-menu__item" onSelect={() => actions?.onUploadImage?.(member)}>
                  <Camera size={15} /> Upload photo
                </DropdownMenu.Item>
                <DropdownMenu.Item className="family-card-menu__item" onSelect={() => actions?.onAddChild?.(member)}>
                  <UserPlus size={15} /> Add child
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </article>
  );
}

function BranchUnit({
  owner,
  members,
  onSelect,
  actions,
  includeHidden = false,
  depth = 0,
}: {
  owner: FamilyMember;
  members: FamilyMember[];
  onSelect: (member: FamilyMember) => void;
  actions?: TreeActions;
  includeHidden?: boolean;
  depth?: number;
}) {
  const memberById = new Map(members.map((member) => [member._id, member]));
  const children = members
    .filter((member) => member.parentIds.includes(owner._id))
    .filter((member) => member._id !== owner._id)
    .sort(sortByFamilyOrder);

  const partners = owner.spouseIds
    .map((partnerId) => memberById.get(partnerId))
    .filter((member): member is FamilyMember => {
      if (!member) return false;
      return member._id !== owner._id && (includeHidden || !member.hideInTree);
    })
    .sort(sortByName);

  const childPartners = new Set(partners.map((partner) => partner._id));
  const visibleChildren = children.filter((child) => includeHidden || !child.hideInTree);
  const showAddChildButton = actions?.mode === 'admin' && actions.onAddChild && (partners.length > 0 || visibleChildren.length > 0);
  const addChildLabel = partners.length ? 'Add child' : '';

  return (
    <div className={`branch-unit ${depth > 0 ? 'branch-unit--nested' : ''}`}>
      <div className={`branch-family-row ${visibleChildren.length ? 'branch-family-row--has-children' : ''}`}>
        <PersonBranchCard member={owner} onClick={onSelect} actions={actions} />
        {partners.map((partner) => <PersonBranchCard key={partner._id} member={partner} onClick={onSelect} actions={actions} />)}
        {showAddChildButton && (
          <button
            type="button"
            className="branch-add-child"
            onClick={() => actions.onAddChild?.(owner)}
            aria-label={`Add child under ${fullName(owner)}`}
          >
            <Plus size={16} />
            {addChildLabel && <span>{addChildLabel}</span>}
          </button>
        )}
      </div>

      {!!visibleChildren.length && (
        <div className="branch-children">
          {visibleChildren.map((child) => {
            const hasOwnChildren = members.some((member) => member.parentIds.includes(child._id) && (includeHidden || !member.hideInTree));
            const childHasVisiblePartner = child.spouseIds.some((spouseId) => {
              const spouse = memberById.get(spouseId);
              return spouse && (includeHidden || !spouse.hideInTree);
            });
            const childOnlyBelongsHere = child.parentIds.every((parentId) => parentId === owner._id || childPartners.has(parentId) || (!includeHidden && memberById.get(parentId)?.hideInTree));

            if ((hasOwnChildren || childHasVisiblePartner) && childOnlyBelongsHere) {
              return <BranchUnit key={child._id} owner={child} members={members} onSelect={onSelect} actions={actions} includeHidden={includeHidden} depth={depth + 1} />;
            }

            return (
              <div key={child._id} className="branch-leaf">
                <PersonBranchCard member={child} onClick={onSelect} actions={actions} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildRootTree(data: TreeData, includeHidden = false) {
  const visibleMembers = data.members.filter((member) => includeHidden || !member.hideInTree);
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

export function FamilyTree({
  data,
  focusId,
  variant = 'default',
  mode = 'public',
  onEdit,
  onAddChild,
  onUploadImage,
}: {
  data: TreeData;
  focusId?: string;
  variant?: 'default' | 'featured' | 'admin';
  mode?: TreeMode;
  onEdit?: (member: FamilyMember) => void;
  onAddChild?: (member: FamilyMember) => void;
  onUploadImage?: (member: FamilyMember) => void;
}) {
  const [selected, setSelected] = useState<FamilyMember | null>(null);
  const includeHidden = mode === 'admin';
  const tree = useMemo(() => buildRootTree(data, includeHidden), [data, includeHidden]);
  const actions = useMemo(() => ({ mode, onEdit, onAddChild, onUploadImage }), [mode, onAddChild, onEdit, onUploadImage]);

  return (
    <>
      <div className={`tree-canvas custom-tree-canvas ${variant === 'featured' ? 'tree-canvas--featured' : ''} ${variant === 'admin' ? 'tree-canvas--admin' : ''}`} data-focus-id={focusId || undefined}>
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
                <TreeLegend />
                <div className="tree-zoom-controls">
                  <button type="button" onClick={() => zoomIn(0.18, 180, 'easeOut')} aria-label="Zoom in"><Plus size={16} /></button>
                  <button type="button" onClick={() => zoomOut(0.18, 180, 'easeOut')} aria-label="Zoom out"><Minus size={16} /></button>
                  <button type="button" onClick={() => resetTransform(200, 'easeOut')} aria-label="Reset zoom"><RotateCcw size={16} /></button>
                </div>
                <TransformComponent wrapperClass="tree-zoom-wrapper" contentClass="tree-zoom-content">
                  <div className="custom-tree">
                    <div className="custom-tree__roots">
                      <PersonBranchCard member={tree.rootA} onClick={setSelected} actions={actions} />
                      {tree.rootB && <PersonBranchCard member={tree.rootB} onClick={setSelected} actions={actions} />}
                    </div>

                    {!!tree.children.length && (
                      <div className="root-branches">
                        {tree.children.map((child) => (
                          <BranchUnit key={child._id} owner={child} members={tree.visibleMembers} onSelect={setSelected} actions={actions} includeHidden={includeHidden} />
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
