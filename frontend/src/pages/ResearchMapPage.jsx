import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { api } from '../api/client.js';
import {
  Share2,
  BookOpen,
  User,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RefreshCw
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Badge } from '../components/shared/Badge.jsx';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';

export function ResearchMapPage() {
  const { workspaceId } = useParams();
  const { currentWorkspace } = useWorkspace();

  const [graphData, setGraphData] = useState({ nodes: [], links: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef(null);

  const loadMap = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${workspaceId}/map`);
      setGraphData(res || { nodes: [], links: [], stats: {} });
    } catch (err) {
      console.error('Failed to load research map:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMap();
  }, [workspaceId]);

  // Compute 2D node coordinates in a circular/clustered layout
  const visibleNodes = graphData.nodes.filter(n =>
    filterType === 'all' || n.type === filterType
  );

  const nodePositions = {};
  const width = 800;
  const height = 550;
  const centerX = width / 2;
  const centerY = height / 2;

  // Group by type for layered radial positioning
  const papers = visibleNodes.filter(n => n.type === 'paper');
  const authors = visibleNodes.filter(n => n.type === 'author');
  const concepts = visibleNodes.filter(n => n.type === 'concept');

  papers.forEach((p, idx) => {
    const angle = (idx / Math.max(1, papers.length)) * 2 * Math.PI;
    const r = 160;
    nodePositions[p.id] = {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
      ...p
    };
  });

  authors.forEach((a, idx) => {
    const angle = (idx / Math.max(1, authors.length)) * 2 * Math.PI + 0.3;
    const r = 260;
    nodePositions[a.id] = {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
      ...a
    };
  });

  concepts.forEach((c, idx) => {
    const angle = (idx / Math.max(1, concepts.length)) * 2 * Math.PI + 0.6;
    const r = 90;
    nodePositions[c.id] = {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
      ...c
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scholarly Research Map"
        description="Explore real conceptual, authorship, and thematic relationships between saved literature. Never decorative or fake."
        badge={<Badge variant="primary">{graphData.stats?.relationshipsCount || 0} Grounded Links</Badge>}
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadMap} loading={loading}>
            Refresh Graph
          </Button>
        }
      />

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Filter View:</span>
          {['all', 'paper', 'concept', 'author'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer capitalize ${
                filterType === t
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'all' ? 'All Entities' : `${t}s`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
            <span>Papers ({graphData.stats?.papersCount || 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
            <span>Authors ({graphData.stats?.authorsCount || 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Concepts ({graphData.stats?.conceptsCount || 0})</span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Mapping relational research graph..." />
      ) : graphData.nodes.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No Research Relationships Mapped"
          description="Save papers into this workspace to visualize shared authors, related concepts, and citation ties."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Map Canvas */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl overflow-hidden relative min-h-[550px] flex items-center justify-center">
            {/* Zoom controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-800/80 backdrop-blur-xs p-1.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.8))}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="text-[10px] font-mono text-slate-400 text-center py-0.5"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.6))}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
              {/* Edges / Links */}
              {graphData.links.map((link, idx) => {
                const src = nodePositions[link.source];
                const tgt = nodePositions[link.target];
                if (!src || !tgt) return null;

                const isConnectedToSelected =
                  selectedNode && (link.source === selectedNode.id || link.target === selectedNode.id);

                return (
                  <line
                    key={idx}
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isConnectedToSelected ? '#38bdf8' : '#334155'}
                    strokeWidth={isConnectedToSelected ? 2.5 : 1}
                    strokeDasharray={link.type === 'authored_by' ? '3 3' : 'none'}
                    opacity={isConnectedToSelected ? 0.9 : 0.4}
                  />
                );
              })}

              {/* Nodes */}
              {Object.values(nodePositions).map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isPaper = node.type === 'paper';
                const isAuthor = node.type === 'author';
                const isConcept = node.type === 'concept';

                const color = isPaper ? '#2563eb' : isAuthor ? '#6366f1' : '#10b981';
                const radius = isPaper ? 14 : isAuthor ? 10 : 8;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        r={radius + 8}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.6"
                      />
                    )}

                    <circle
                      r={radius}
                      fill={color}
                      stroke={isSelected ? '#ffffff' : '#1e293b'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Node label */}
                    <text
                      dy={radius + 12}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Node Inspector Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <Badge variant={selectedNode.type === 'paper' ? 'primary' : selectedNode.type === 'author' ? 'indigo' : 'success'}>
                    {selectedNode.type?.toUpperCase()} ENTITY
                  </Badge>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedNode.fullTitle || selectedNode.label}
                  </h3>
                  {selectedNode.journal && (
                    <p className="text-xs text-slate-500 italic mt-1">{selectedNode.journal}</p>
                  )}
                  {selectedNode.year && (
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Published: {selectedNode.year}</p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                    Network Context
                  </span>
                  <p>
                    Connected through verified metadata in your research workspace.
                  </p>
                </div>

                {selectedNode.type === 'paper' && selectedNode.originalId && (
                  <Link to={`/workspaces/${workspaceId}/paper/${selectedNode.originalId}`}>
                    <Button variant="primary" size="sm" icon={BookOpen} className="w-full mt-2">
                      Inspect Full Paper
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs my-auto">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Select any node in the map</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Inspect interconnected authors, papers, and concepts.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 italic">
              *All nodes and connections represent verified scholarly metadata.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
