import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Heart } from 'lucide-react';
import type { FamilyMember } from '../../types';

export function PersonNode({ data, selected }: NodeProps) {
  const member = data.member as FamilyMember;
  const name = `${member.firstName} ${member.lastName}`;

  return (
    <div className={`person-node ${selected ? 'person-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="person-node__portrait">
        {member.profileImage ? <img src={member.profileImage} alt={name} /> : <span>{member.firstName[0]}{member.lastName[0]}</span>}
        {member.featured && <i><Heart size={11} fill="currentColor" /></i>}
      </div>
      <div className="min-w-0">
        <strong>{name}</strong>
        <small>{member.birthDate ? new Date(member.birthDate).getFullYear() : 'Year unknown'}{member.deathDate ? ` – ${new Date(member.deathDate).getFullYear()}` : ''}</small>
        <em>{member.branch || 'Family'} branch</em>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
