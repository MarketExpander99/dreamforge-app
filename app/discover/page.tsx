// app/discover/page.tsx
'use client';

import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search, ArrowLeft, BookOpen, Share2, Plus, Network, CreditCard, Crown } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DiscoverPage() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [centerNode, setCenterNode] = useState('');
  const [connectedNodes, setConnectedNodes] = useState<string[]>([]);
  const [possibleUses, setPossibleUses] = useState<string[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [credits] = useState(12);
  const [isDeepQuery, setIsDeepQuery] = useState(false);

  const fetchConnectedData = (query: string) => {
    if (!query.trim()) return;
    
    setCenterNode(query);
    setBreadcrumb(prev => [...new Set([...prev, query])]);

    // Mock connected nodes (you can replace with real logic later)
    setTimeout(() => {
      setConnectedNodes(['Engine', 'Transmission', 'Wheels', 'Brakes', 'Battery', 'ECU']);
      setPossibleUses(['Daily Driving', 'Racing', 'Off-road', 'Electric Conversion', 'Restoration']);
    }, 300);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchConnectedData(searchTerm.trim());
    }
  };

  const handleNodeClick = (node: string) => {
    setSearchTerm(node);
    fetchConnectedData(node);
  };

  const handleBack = () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1);
      setBreadcrumb(newBreadcrumb);
      const previous = newBreadcrumb[newBreadcrumb.length - 1];
      setCenterNode(previous);
      setSearchTerm(previous);
      fetchConnectedData(previous);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Discover the Lattice</h1>
              <p className="text-muted-foreground">Infinite E8 Knowledge Lattice • Powered by Grok</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted px-5 py-3 rounded-3xl">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-xl">{credits}</span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
              <Button variant="outline">Top Up</Button>
              <Button className="gap-2">
                <Crown className="h-4 w-4" />
                View Plans
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any topic... (e.g. Car, Gearbox, Fast Food, Quantum Computing)"
                className="pl-14 py-8 text-lg rounded-3xl border-2"
              />
            </div>
          </form>

          {/* Results Area */}
          {centerNode && (
            <>
              {/* Breadcrumb + Back */}
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={handleBack} disabled={breadcrumb.length <= 1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  {breadcrumb.map((crumb, i) => (
                    <span key={i}>{crumb}{i < breadcrumb.length - 1 && ' → '}</span>
                  ))}
                </div>
              </div>

              <p className="text-sm font-medium mb-3 text-muted-foreground">Connected Nodes</p>
              <div className="flex flex-wrap gap-3 mb-8">
                {connectedNodes.map((node) => (
                  <Button
                    key={node}
                    variant="outline"
                    className="rounded-2xl px-6 py-6 text-base"
                    onClick={() => handleNodeClick(node)}
                  >
                    {node}
                  </Button>
                ))}
              </div>

              {/* Possible Uses */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Possible uses for {centerNode}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {possibleUses.map((use) => (
                      <Badge key={use} variant="secondary" className="px-5 py-2 text-sm">
                        {use}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex gap-3 mb-10">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  View on Grokipedia
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share on X
                </Button>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add to Learning Path
                </Button>
              </div>
            </>
          )}

          {/* View Mode + DeepQuery */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <Button variant="default">Knowledge Lattice</Button>
              <Button variant="outline">List View</Button>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isDeepQuery} onCheckedChange={setIsDeepQuery} />
              <span className="text-sm font-medium">DeepQuery Mode <span className="text-muted-foreground">(Premium)</span></span>
            </div>
          </div>

          {/* Placeholder for Lattice / Graph */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl h-96 flex items-center justify-center">
            <p className="text-muted-foreground text-lg">
              {centerNode ? `Lattice visualization for "${centerNode}" will appear here` : 'Search something to explore the lattice'}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}