'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Search, BookOpen, Share2, Plus } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  description: string;
  function: string;
  components: string[];
  proficiency: number;
}

export default function DiscoverPage() {
  const [centerNode, setCenterNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Node[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Mock Grok API call (replace with real /api/grok later)
  const callGrok = async (topic: string) => {
    setIsLoading(true);
    try {
      // For now we use realistic mock data
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockData = {
        label: topic,
        description: `Deep interconnected knowledge about ${topic}. This topic sits at the center of many systems and has rich relationships across domains.`,
        function: `Serves as a core building block in its domain with multiple real-world applications.`,
        components: ['Core Component 1', 'Core Component 2', 'Related System A', 'Related System B', 'Advanced Variant'],
      };

      const newNode: Node = {
        id: Date.now().toString(),
        label: mockData.label,
        description: mockData.description,
        function: mockData.function,
        components: mockData.components,
        proficiency: Math.floor(Math.random() * 40) + 35,
      };

      setCenterNode(newNode);
      setHistory(prev => [newNode, ...prev].slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const exploreTopic = (topic: string) => {
    if (!topic.trim()) return;
    callGrok(topic);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedNodes);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedNodes(newSet);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-foreground">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Discover the Lattice</h1>
              <p className="text-muted-foreground">Infinite E8 Knowledge Lattice • Powered by Grok</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-3 mb-8 max-w-2xl">
            <Input
              placeholder="Search anything... (Car, Gearbox, Fast Food Chef, Quantum Computing...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && exploreTopic(searchQuery)}
              className="py-6 text-lg"
            />
            <Button 
              onClick={() => exploreTopic(searchQuery)} 
              disabled={isLoading}
              className="px-10"
            >
              {isLoading ? 'Exploring...' : 'Explore'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Lattice / Visual Area */}
            <div className="lg:col-span-7">
              <Card className="h-[620px] flex flex-col">
                <CardHeader>
                  <CardTitle>
                    {centerNode ? `Lattice — ${centerNode.label}` : 'Knowledge Lattice'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center border-t bg-zinc-950 dark:bg-zinc-900 rounded-b-xl">
                  {centerNode ? (
                    <div className="text-center">
                      <p className="text-2xl font-medium text-blue-400 mb-4">{centerNode.label}</p>
                      <p className="text-muted-foreground">3D Lattice visualization coming soon...</p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p className="text-lg">What would you like to explore?</p>
                      <p className="text-sm mt-2">Search above to begin your journey</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Panel */}
            <div className="lg:col-span-5">
              {centerNode ? (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-2xl">{centerNode.label}</CardTitle>
                    <Badge>Proficiency: {centerNode.proficiency}%</Badge>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div>
                      <h4 className="font-semibold mb-2">Deep Understanding</h4>
                      <p className="text-sm leading-relaxed">{centerNode.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Core Function</h4>
                      <p className="text-sm">{centerNode.function}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Connected Nodes</h4>
                      <div className="flex flex-wrap gap-2">
                        {centerNode.components.map((comp, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            onClick={() => exploreTopic(comp)}
                            className="text-xs"
                          >
                            {comp}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center text-center p-12">
                  <div>
                    <p className="text-muted-foreground">The universe of knowledge awaits.</p>
                    <p className="text-sm mt-4">Start by searching any topic above.</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}