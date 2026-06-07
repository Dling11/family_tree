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

function layout(data: TreeData): { nodes: Node[]; edges: Edge[] } {
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

  const edges: Edge[] = data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type === 'spouse' ? 'straight' : 'smoothstep',
    animated: edge.type === 'spouse',
    label: edge.type === 'spouse' ? '♥' : undefined,
    style: { stroke: edge.type === 'spouse' ? '#CE2626' : '#a83232', strokeWidth: edge.type === 'spouse' ? 2.5 : 1.7 },
    markerEnd: edge.type === 'parent' ? { type: MarkerType.ArrowClosed, color: '#a83232', width: 14, height: 14 } : undefined,
    labelStyle: { fill: '#CE2626', fontSize: 16 },
  }));

  return { nodes, edges };
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
          fitViewOptions={{ padding: 0.22, nodes: focusId ? [{ id: focusId }] : undefined }}
          minZoom={0.25}
          maxZoom={1.7}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#c9c1af" gap={28} size={1} />
          <Controls showInteractive={false} />
          <MiniMap nodeColor="#CE2626" maskColor="rgba(255,255,255,.75)" />
        </ReactFlow>
      </div>
      <PersonModal member={selected} onClose={() => setSelected(null)} />
    </>
  );
}
