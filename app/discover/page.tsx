'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search, BookOpen, Share2, Plus, CreditCard, Crown } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  short_description: string;
  main_function: string;
  components: string[];
  self_similar: string[];        // New: Variants / self-similar entities
  deep_details?: string;         // Extra info when DeepQuery is on
}

export default function DiscoverPage() {
  const [centerNode, setCenterNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepQuery, setIsDeepQuery] = useState(false);
  const [credits, setCredits] = useState(8); // Mock daily free credits

  const callGrok = async (topic: string) => {
    if (credits <= 0) {
      alert("You've used your free credits for today. Please buy more to continue.");
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `You are a helpful exploration assistant.
For the topic "${topic}", return ONLY valid JSON with this structure:

{
  "label": "${topic}",
  "short_description": "Clear 1-2 sentence description",
  "main_function": "What this thing does or its purpose",
  "components": ["component1", "component2", ...],
  "self_similar": ["similar item 1", "similar item 2", ...],
  ${isDeepQuery ? `"deep_details": "Detailed information including manufacturing, processes, cost factors, variations, or advanced insights"` : ''}
}`;

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      const newNode: Node = {
        id: Date.now().toString(),
        label: parsed.label || topic,
        short_description: parsed.short_description || '',
        main_function: parsed.main_function || '',
        components: parsed.components || [],
        self_similar: parsed.self_similar || [],
        deep_details: parsed.deep_details || undefined,
      };

      setCenterNode(newNode);
      setCredits(prev => prev - 1); // Use 1 credit per query
    } catch (error) {
      console.error(error);
      alert('Could not connect to Grok. Please check your API setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const exploreTopic = (topic: string) => {
    if (!topic.trim()) return;
    callGrok(topic);
  };

  const handleComponentClick = (comp: string) => {
    setSearchQuery(comp);
    callGrok(comp);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
              <p className="text-muted-foreground">Explore anything • Break it down • Drill deeper</p>
            </div>

            {/* Credits */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-3xl">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-xl">{credits}</span>
                <span className="text-sm text-muted-foreground">credits left</span>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => alert('Payment gateway coming soon!')}>
                <Crown className="h-4 w-4" />
                Buy Credits
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 mb-10 max-w-2xl">
            <Input
              placeholder="Search anything... (cheese burger, car, laptop, photosynthesis...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && exploreTopic(searchQuery)}
              className="py-6 text-lg"
            />
            <Button 
              onClick={() => exploreTopic(searchQuery)} 
              disabled={isLoading || credits <= 0}
              className="px-10"
            >
              {isLoading ? 'Exploring...' : 'Explore'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-7">
              <Card className="h-[620px] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {centerNode ? centerNode.label : 'Start Exploring'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">DeepQuery</span>
                    <Switch checked={isDeepQuery} onCheckedChange={setIsDeepQuery} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-8 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-b-xl">
                  {centerNode ? (
                    <div className="max-w-lg text-center">
                      <p className="text-lg leading-relaxed">{centerNode.short_description}</p>
                      {isDeepQuery && centerNode.deep_details && (
                        <p className="mt-6 text-sm text-blue-600 dark:text-blue-400">{centerNode.deep_details}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p className="text-xl">What would you like to explore today?</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-5">
              {centerNode ? (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-2xl">{centerNode.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div>
                      <h4 className="font-semibold mb-2">What it is</h4>
                      <p className="text-sm leading-relaxed">{centerNode.short_description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Main Function</h4>
                      <p className="text-sm">{centerNode.main_function}</p>
                    </div>

                    {/* Self-Similar / Variants */}
                    {centerNode.self_similar && centerNode.self_similar.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Self-Similar / Variants</h4>
                        <div className="flex flex-wrap gap-2">
                          {centerNode.self_similar.map((variant, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchQuery(variant);
                                callGrok(variant);
                              }}
                            >
                              {variant}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Components */}
                    <div>
                      <h4 className="font-semibold mb-3">Components & Connected Parts</h4>
                      <div className="flex flex-wrap gap-2">
                        {centerNode.components.map((comp, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            onClick={() => handleComponentClick(comp)}
                          >
                            {comp}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button variant="outline" className="gap-2 flex-1">
                        <BookOpen className="h-4 w-4" />
                        Grokipedia
                      </Button>
                      <Button variant="outline" className="gap-2 flex-1">
                        <Plus className="h-4 w-4" />
                        Add to Path
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center text-center p-12">
                  <p className="text-muted-foreground">Search something to see its components and variants.</p>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}