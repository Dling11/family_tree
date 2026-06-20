import { useCallback, useMemo, useState } from 'react';
import dagre from '@dagrejs/dagre';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import type { FamilyMember, TreeData } from '../../types';
import { PersonNode } from './PersonNode';
import { PersonModal } from '../ui/PersonModal';

const nodeTypes = { person: PersonNode };
const width = 230;
const height = 104;
const branchGapX = 520;
const partnerGapX = 275;
const childGapY = 190;
const childRowGapY = 148;

const sortByName = (first: FamilyMember, second: FamilyMember) => `${first.firstName} ${first.lastName}`.localeCompare(`${second.firstName} ${second.lastName}`);

function buildEdges(edges: TreeData['edges'], softParents = false): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type === 'spouse' ? 'straight' : 'smoothstep',
    animated: edge.type === 'spouse',
    label: edge.type === 'spouse' ? '♥' : undefined,
    style: {
      stroke: edge.type === 'spouse' ? '#CE2626' : '#a83232',
      strokeWidth: edge.type === 'spouse' ? 2.5 : 1.6,
      opacity: edge.type === 'parent' && softParents ? 0.48 : 1,
    },
    markerEnd: edge.type === 'parent' ? { type: MarkerType.ArrowClosed, color: '#a83232', width: 14, height: 14 } : undefined,
    labelStyle: { fill: '#CE2626', fontSize: 16 },
  }));
}

function rootBranchLayout(data: TreeData): { nodes: Node[]; edges: Edge[] } | null {
  const roots = data.members.filter((member) => !member.parentIds.length && member.generation === 1);
  const rootA = roots.find((member) => member.spouseIds.some((spouseId) => roots.some((root) => root._id === spouseId)));
  if (!rootA) return null;

  const rootB = roots.find((member) => rootA.spouseIds.includes(member._id));
  if (!rootB) return null;

  const children = data.members
    .filter((member) => member.parentIds.includes(rootA._id) || member.parentIds.includes(rootB._id))
    .sort(sortByName);

  if (children.length < 4) return null;

  const rootIds = new Set([rootA._id, rootB._id]);
  const childIds = new Set(children.map((child) => child._id));
  const memberById = new Map(data.members.map((member) => [member._id, member]));
  const totalWidth = (children.length - 1) * branchGapX;

  const nodes: Node[] = [];
  const pushNode = (member: FamilyMember, x: number, y: number) => {
    if (nodes.some((node) => node.id === member._id)) return;
    nodes.push({
      id: member._id,
      type: 'person',
      position: { x, y },
      data: { member },
    });
  };

  pushNode(rootA, totalWidth / 2 - width - 18, 20);
  pushNode(rootB, totalWidth / 2 + 18, 20);

  children.forEach((child, index) => {
    const baseX = index * branchGapX;
    const baseY = 300;
    const directChildren = data.members
      .filter((member) => !rootIds.has(member._id) && !childIds.has(member._id) && member.parentIds.includes(child._id))
      .sort(sortByName);
    const partnerIds = new Set(child.spouseIds);

    directChildren.forEach((descendant) => {
      descendant.parentIds.forEach((parentId) => {
        if (parentId !== child._id && !rootIds.has(parentId) && !childIds.has(parentId)) partnerIds.add(parentId);
      });
    });

    const partners = [...partnerIds]
      .map((partnerId) => memberById.get(partnerId))
      .filter((member): member is FamilyMember => Boolean(member))
      .sort(sortByName);
    const partnerIndexById = new Map(partners.map((partner, partnerIndex) => [partner._id, partnerIndex]));

    pushNode(child, baseX, baseY);
    partners.forEach((partner, partnerIndex) => {
      pushNode(partner, baseX + partnerGapX * (partnerIndex + 1), baseY);
    });

    directChildren.forEach((descendant, descendantIndex) => {
      const coParentId = descendant.parentIds.find((parentId) => parentId !== child._id && partnerIndexById.has(parentId));
      const coParentIndex = coParentId ? partnerIndexById.get(coParentId) ?? 0 : 0;
      const childX = coParentId ? baseX + (partnerGapX * (coParentIndex + 1)) / 2 : baseX;
      pushNode(descendant, childX, baseY + childGapY + descendantIndex * childRowGapY);
    });
  });

  const placedIds = new Set(nodes.map((node) => node.id));
  const parentEdges = [
    ...children.map((child) => ({
      id: `branch-${rootA._id}-${child._id}`,
      source: rootA._id,
      target: child._id,
      type: 'parent' as const,
    })),
    ...data.edges.filter((edge) => edge.type === 'parent' && placedIds.has(edge.source) && placedIds.has(edge.target) && !rootIds.has(edge.source)),
  ];
  const spouseEdges = data.edges.filter((edge) => edge.type === 'spouse' && placedIds.has(edge.source) && placedIds.has(edge.target));

  return { nodes, edges: buildEdges([...parentEdges, ...spouseEdges], true) };
}

function dagreLayout(data: TreeData): { nodes: Node[]; edges: Edge[] } {
  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'TB', ranksep: 110, nodesep: 44, marginx: 40, marginy: 40 });
  data.members.forEach((member) => graph.setNode(member._id, { width, height }));
  data.edges.filter((edge) => edge.type === 'parent').forEach((edge) => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  const nodes = data.members.map((member) => {
    const point = graph.node(member._id) || { x: 0, y: 0 };
    return {
      id: member._id,
      type: 'person',
      position: { x: point.x - width / 2, y: point.y - height / 2 },
      data: { member },
    };
  });

  return { nodes, edges: buildEdges(data.edges) };
}

function layout(data: TreeData): { nodes: Node[]; edges: Edge[] } {
  return rootBranchLayout(data) || dagreLayout(data);
}

export function FamilyTree({ data, focusId, variant = 'default' }: { data: TreeData; focusId?: string; variant?: 'default' | 'featured' }) {
  const [selected, setSelected] = useState<FamilyMember | null>(null);
  const laidOut = useMemo(() => layout(data), [data]);
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => setSelected(node.data.member as FamilyMember), []);

  return (
    <>
      <div className={`tree-canvas ${variant === 'featured' ? 'tree-canvas--featured' : ''}`}>
        <ReactFlow
          nodes={laidOut.nodes}
          edges={laidOut.edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.16, nodes: focusId ? [{ id: focusId }] : undefined }}
          minZoom={0.2}
          maxZoom={1.7}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d8d2ca" gap={28} size={1} />
          <Controls showInteractive={false} />
          <MiniMap nodeColor="#CE2626" maskColor="rgba(255,255,255,.75)" />
        </ReactFlow>
      </div>
      <PersonModal member={selected} onClose={() => setSelected(null)} />
    </>
  );
}
