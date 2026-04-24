'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Building2,
  Heart,
  Landmark,
  PiggyBank,
  Shield,
  User,
  Users,
  Wallet,
  FileCheck,
  HandCoins,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const RISK_COLORS: Record<string, string> = {
  red: '#C0392B',
  amber: '#D97706',
  green: '#166534',
  slate: '#94A3B8',
};

type EstateNodeType =
  | 'person'
  | 'spouse'
  | 'child'
  | 'trust'
  | 'llc'
  | 'asset'
  | 'account'
  | 'policy'
  | 'entity'
  | 'beneficiary';

interface ClientLike {
  id: string;
  first_name?: string;
  last_name?: string;
  spouse_first_name?: string;
  number_of_children?: number;
  trust_signed_date?: string | null;
  trust_funded?: boolean;
  entity_type?: string;
  is_physician?: boolean;
  practice_entity_type?: string;
  practice_name?: string;
}

interface EstateNodeData {
  label: string;
  node_type: EstateNodeType;
  risk_level: 'red' | 'amber' | 'green' | 'slate';
  details?: string;
  recommended_actions?: string[];
}

interface EstateCanvasProps {
  client: ClientLike;
  tenant_id: string;
  onNodeSelect: (node: Node<EstateNodeData> | null) => void;
}

const TYPE_ICON: Record<EstateNodeType, React.ComponentType<{ size?: number; color?: string }>> = {
  person: User,
  spouse: Heart,
  child: Users,
  trust: Landmark,
  llc: Building2,
  asset: Shield,
  account: Wallet,
  policy: FileCheck,
  entity: Building2,
  beneficiary: HandCoins,
};

function EstateCardNode({ data }: { data: EstateNodeData }) {
  const Icon = TYPE_ICON[data.node_type] ?? PiggyBank;
  const borderColor = RISK_COLORS[data.risk_level] ?? RISK_COLORS.slate;

  return (
    <div
      className="min-w-[180px] rounded-xl border bg-white px-3 py-2 shadow-md"
      style={{ borderColor }}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} color={borderColor} />
        <p className="text-sm font-semibold" style={{ color: '#0F1923' }}>
          {data.label}
        </p>
      </div>
      <p className="mt-1 text-xs uppercase tracking-wide" style={{ color: borderColor }}>
        {data.node_type}
      </p>
    </div>
  );
}

const nodeTypes = { estateCard: EstateCardNode };

export default function EstateCanvas({ client, tenant_id, onNodeSelect }: EstateCanvasProps) {
  const supabase = createClient();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<EstateNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [ready, setReady] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge({ ...connection, style: { stroke: '#CBD5E1' } }, current)),
    [setEdges]
  );

  const saveGraph = useCallback(
    async (graphNodes: Node<EstateNodeData>[], graphEdges: Edge[]) => {
      const nodeRows = graphNodes.map((node) => ({
        tenant_id,
        client_id: client.id,
        node_type: node.data.node_type,
        label: node.data.label,
        risk_level: node.data.risk_level,
        position_x: node.position.x,
        position_y: node.position.y,
        metadata: {
          details: node.data.details ?? '',
          recommended_actions: node.data.recommended_actions ?? [],
          flow_id: node.id,
        },
      }));

      const edgeRows = graphEdges.map((edge) => ({
        tenant_id,
        client_id: client.id,
        source_node_id: edge.source,
        target_node_id: edge.target,
        relationship: edge.label ?? 'linked',
      }));

      await supabase.from('estate_nodes').delete().eq('tenant_id', tenant_id).eq('client_id', client.id);
      await supabase.from('estate_edges').delete().eq('tenant_id', tenant_id).eq('client_id', client.id);

      if (nodeRows.length > 0) {
        await supabase.from('estate_nodes').insert(nodeRows);
      }
      if (edgeRows.length > 0) {
        await supabase.from('estate_edges').insert(edgeRows);
      }
    },
    [client.id, supabase, tenant_id]
  );

  const buildDefaultGraph = useCallback(() => {
    const graphNodes: Node<EstateNodeData>[] = [];
    const graphEdges: Edge[] = [];
    let x = 80;

    const personId = `person-${client.id}`;
    graphNodes.push({
      id: personId,
      type: 'estateCard',
      position: { x, y: 120 },
      data: {
        node_type: 'person',
        label: `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || 'Client',
        risk_level: 'slate',
        details: 'Primary client profile.',
        recommended_actions: [],
      },
    });
    x += 240;

    if (client.spouse_first_name) {
      const spouseId = `spouse-${client.id}`;
      graphNodes.push({
        id: spouseId,
        type: 'estateCard',
        position: { x, y: 120 },
        data: {
          node_type: 'spouse',
          label: client.spouse_first_name,
          risk_level: 'slate',
          details: 'Spouse linked to estate plan.',
          recommended_actions: ['Confirm spouse beneficiary assignments.'],
        },
      });
      graphEdges.push({ id: `${personId}-${spouseId}`, source: personId, target: spouseId, style: { stroke: '#CBD5E1' } });
      x += 240;
    }

    if (client.trust_signed_date) {
      const funded = Boolean(client.trust_funded);
      const trustId = `trust-${client.id}`;
      graphNodes.push({
        id: trustId,
        type: 'estateCard',
        position: { x, y: 280 },
        data: {
          node_type: 'trust',
          label: funded ? 'Revocable Trust' : 'Revocable Trust (UNFUNDED)',
          risk_level: funded ? 'green' : 'red',
          details: funded ? 'Trust documented and funded.' : 'Trust executed but funding incomplete.',
          recommended_actions: funded ? [] : ['Fund trust assets and retitle major accounts.'],
        },
      });
      graphEdges.push({ id: `${personId}-${trustId}`, source: personId, target: trustId, style: { stroke: '#CBD5E1' } });
      x += 240;
    }

    if (client.entity_type) {
      const entityType = client.entity_type.toUpperCase();
      const entityId = `entity-${client.id}`;
      const isRiskyEntity = entityType === 'PA';
      graphNodes.push({
        id: entityId,
        type: 'estateCard',
        position: { x, y: 120 },
        data: {
          node_type: 'entity',
          label: `${entityType}${client.practice_name ? ` - ${client.practice_name}` : ''}`,
          risk_level: isRiskyEntity ? 'red' : 'green',
          details: 'Business entity tied to client estate profile.',
          recommended_actions: isRiskyEntity ? ['Review PA liability structure and conversion options.'] : [],
        },
      });
      graphEdges.push({ id: `${personId}-${entityId}`, source: personId, target: entityId, style: { stroke: '#CBD5E1' } });
      x += 240;
    }

    if (client.is_physician && client.practice_entity_type) {
      const practiceId = `practice-${client.id}`;
      const highRiskPractice = client.practice_entity_type.toUpperCase() === 'PA';
      graphNodes.push({
        id: practiceId,
        type: 'estateCard',
        position: { x, y: 280 },
        data: {
          node_type: 'llc',
          label: `${client.practice_entity_type.toUpperCase()}${client.practice_name ? ` - ${client.practice_name}` : ' Practice'}`,
          risk_level: highRiskPractice ? 'red' : 'green',
          details: 'Medical practice entity footprint.',
          recommended_actions: highRiskPractice ? ['Review malpractice insulation and entity update options.'] : [],
        },
      });
      graphEdges.push({ id: `${personId}-${practiceId}`, source: personId, target: practiceId, style: { stroke: '#CBD5E1' } });
    }

    const childCount = Number(client.number_of_children ?? 0);
    for (let i = 0; i < childCount; i += 1) {
      const childId = `child-${client.id}-${i + 1}`;
      graphNodes.push({
        id: childId,
        type: 'estateCard',
        position: { x: 80 + i * 220, y: 460 },
        data: {
          node_type: 'child',
          label: `Child ${i + 1}`,
          risk_level: 'slate',
          details: 'Dependent or descendant participant in plan.',
          recommended_actions: ['Confirm guardianship and beneficiary language.'],
        },
      });
      graphEdges.push({ id: `${personId}-${childId}`, source: personId, target: childId, style: { stroke: '#CBD5E1' } });
    }

    return { graphNodes, graphEdges };
  }, [client]);

  useEffect(() => {
    const loadCanvas = async () => {
      const { data: existingNodes } = await supabase
        .from('estate_nodes')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('client_id', client.id);

      const { data: existingEdges } = await supabase
        .from('estate_edges')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('client_id', client.id);

      if (existingNodes && existingNodes.length > 0) {
        const loadedNodes: Node<EstateNodeData>[] = existingNodes.map((row: any, index: number) => ({
          id: row.metadata?.flow_id ?? row.id ?? `node-${index}`,
          type: 'estateCard',
          position: {
            x: Number(row.position_x ?? 80 + index * 80),
            y: Number(row.position_y ?? 120),
          },
          data: {
            node_type: row.node_type,
            label: row.label ?? row.node_type,
            risk_level: row.risk_level ?? 'slate',
            details: row.metadata?.details ?? '',
            recommended_actions: row.metadata?.recommended_actions ?? [],
          },
        }));

        const loadedEdges: Edge[] = (existingEdges ?? []).map((row: any, index: number) => ({
          id: row.id ?? `edge-${index}`,
          source: row.source_node_id,
          target: row.target_node_id,
          label: row.relationship ?? 'linked',
          style: { stroke: '#CBD5E1' },
        }));

        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setReady(true);
        return;
      }

      const { graphNodes, graphEdges } = buildDefaultGraph();
      setNodes(graphNodes);
      setEdges(graphEdges);
      await saveGraph(graphNodes, graphEdges);
      setReady(true);
    };

    void loadCanvas();
  }, [buildDefaultGraph, client.id, saveGraph, setEdges, setNodes, supabase, tenant_id]);

  const onNodeClick: NodeMouseHandler<Node<EstateNodeData>> = useCallback(
    (_event, node) => onNodeSelect(node),
    [onNodeSelect]
  );

  const minimapStyle = useMemo(() => ({ background: '#12202D' }), []);

  if (!ready) {
    return (
      <div className="h-full w-full animate-pulse rounded-xl" style={{ backgroundColor: '#0F1923' }} />
    );
  }

  return (
    <div className="h-full w-full rounded-xl" style={{ backgroundColor: '#0F1923' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#1E293B" />
        <Controls />
        <MiniMap
          pannable
          zoomable
          style={minimapStyle}
          nodeColor={(node) => RISK_COLORS[(node.data as EstateNodeData).risk_level] ?? RISK_COLORS.slate}
        />
      </ReactFlow>
    </div>
  );
}
