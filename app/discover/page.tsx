'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Node {
  id: string;
  label: string;
  description: string;
  function: string;
  components: string[];
  proficiency: number;
}

const DiscoverPage = () => {
  const [centerNode, setCenterNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Node[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const callGrok = async (prompt: string) => {
    const response = await fetch('/api/grok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    return typeof data === 'string' ? JSON.parse(data) : data;
  };

  const exploreTopic = async (topic: string) => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const prompt = `You are an E8 lattice + quantum entanglement educator. For topic "${topic}", return ONLY valid JSON: {"label": "...", "description": "deep explanation of how it is made, its function and processes", "function": "...", "components": ["item1", "item2", ...]}`;

      const data = await callGrok(prompt);
      const newNode: Node = {
        id: Date.now().toString(),
        label: data.label || topic,
        description: data.description || '',
        function: data.function || '',
        components: data.components || [],
        proficiency: Math.floor(Math.random() * 40) + 10,
      };

      setCenterNode(newNode);
      setHistory(prev => [newNode, ...prev].slice(0, 8));
      confetti({ particleCount: 80, spread: 60 });
    } catch (e) {
      console.error(e);
      alert('Grok API call failed – please check your XAI_API_KEY');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedNodes);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedNodes(newSet);
  };

  const TreeView = ({ node, depth = 0 }: { node: Node; depth?: number }) => (
    <div style={{ paddingLeft: `${depth * 20}px` }}>
      <div className="flex items-center gap-2 py-3 border-b border-zinc-800 hover:bg-zinc-900 rounded">
        <Button variant="ghost" size="icon" onClick={() => toggleExpand(node.id)}>
          {expandedNodes.has(node.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </Button>
        <button onClick={() => setCenterNode(node)} className="flex-1 text-left font-medium">
          {node.label}
        </button>
        <Badge variant="outline">{node.proficiency}%</Badge>
      </div>
      {expandedNodes.has(node.id) && node.components.map((comp, i) => (
        <div key={i} className="pl-6 py-1">
          <button onClick={() => exploreTopic(comp)} className="text-sm text-purple-300 hover:text-purple-400 flex items-center gap-1">
            → {comp}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-violet-400 bg-clip-text text-transparent">Discover</h1>
            <p className="text-zinc-400">Infinite E8 knowledge lattice • Powered by Grok</p>
          </div>
          <Badge className="text-xs">Quantum Entanglement • Quantum Immortality Mode</Badge>
        </div>

        <div className="flex gap-3 mb-8">
          <Input
            placeholder="Type anything... PC, Accountant, Grade 12, Photosynthesis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-900 border-zinc-700 py-6 text-base"
            onKeyDown={(e) => e.key === 'Enter' && exploreTopic(searchQuery)}
          />
          <Button onClick={() => exploreTopic(searchQuery)} disabled={isLoading} className="px-8 whitespace-nowrap">
            {isLoading ? 'Exploring...' : 'Explore Lattice'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Card className="bg-zinc-900 border-zinc-700 overflow-hidden h-[520px] lg:h-[620px]">
              <CardHeader className="pb-3">
                <CardTitle>Knowledge Lattice {centerNode && `— ${centerNode.label}`}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-4.5rem)] relative">
                {isMobile || !centerNode ? (
                  <div className="p-6 overflow-auto h-full bg-zinc-950">
                    {centerNode ? <TreeView node={centerNode} /> : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
                        <p className="text-lg">Your lattice exploration starts here</p>
                        <p className="text-sm mt-3">Mobile uses lightweight tree view for speed</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Canvas camera={{ position: [0, 0, 18] }} style={{ background: '#09090b' }}>
                    <ambientLight intensity={0.4} />
                    <pointLight position={[15, 15, 15]} intensity={1.2} />
                    <Stars radius={200} depth={50} count={5000} factor={3} saturation={0} fade />
                    {centerNode && (
                      <>
                        <mesh position={[0, 0, 0]}>
                          <sphereGeometry args={[2.2]} />
                          <meshStandardMaterial color="#3b82f6" emissive="#1e3a8a" emissiveIntensity={0.6} />
                        </mesh>
                        {centerNode.components.map((comp, i) => {
                          const angle = (i * (Math.PI * 2)) / centerNode.components.length;
                          const radius = 7 + Math.sin(i) * 1.5;
                          const x = Math.cos(angle) * radius;
                          const z = Math.sin(angle) * radius;
                          return (
                            <group key={i} position={[x, (i % 3) - 1, z]}>
                              <mesh onClick={() => exploreTopic(comp)}>
                                <sphereGeometry args={[1.1]} />
                                <meshStandardMaterial color="#a855f7" emissive="#581c87" />
                              </mesh>
                            </group>
                          );
                        })}
                      </>
                    )}
                    <OrbitControls enablePan enableZoom enableRotate />
                  </Canvas>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5">
            {centerNode ? (
              <Card className="bg-zinc-900 border-zinc-700 h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">{centerNode.label}</CardTitle>
                  <Badge>Proficiency: {centerNode.proficiency}%</Badge>
                </CardHeader>
                <CardContent className="space-y-6 text-sm lg:text-base">
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-400">Deep Understanding</h4>
                    <p className="text-zinc-300 leading-relaxed">{centerNode.description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-purple-400">Core Function &amp; Processes</h4>
                    <p className="text-zinc-300">{centerNode.function}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Connected Nodes</h4>
                    <div className="flex flex-wrap gap-2">
                      {centerNode.components.map((comp, i) => (
                        <Button key={i} variant="outline" size="sm" onClick={() => exploreTopic(comp)} className="border-purple-500/50 hover:bg-purple-950">
                          {comp}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-zinc-900 border-zinc-700 h-full flex items-center justify-center text-center p-10">
                <div className="max-w-xs">
                  <p className="text-zinc-400">The universe of knowledge awaits.</p>
                  <p className="text-sm text-zinc-500 mt-3">Search anything. Drill infinitely deep with Grok.</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <Card className="mt-8 bg-zinc-900 border-zinc-700">
            <CardHeader><CardTitle>Recent Explorations</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {history.map((node) => (
                  <Button key={node.id} variant="ghost" onClick={() => setCenterNode(node)} className="border border-zinc-700 hover:border-blue-500 text-sm">
                    {node.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;