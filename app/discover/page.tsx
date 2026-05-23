'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Share2, Plus, CreditCard, Crown } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  short_description: string;
  main_function: string;
  components: string[];
  self_similar: string[];
  deep_details?: string;
}

export default function DiscoverPage() {
  const [centerNode, setCenterNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(8);

  const callGrok = async (topic: string, isDeep: boolean = false) => {
    if (credits <= 0) {
      alert("You've used your free credits for today. Buy more to continue.");
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `You are a helpful exploration assistant.
For the topic "${topic}", return ONLY valid JSON:

{
  "label": "${topic}",
  "short_description": "Clear 1-2 sentence description",
  "main_function": "What this thing does or its purpose",
  "components": ["component1", "component2", ...],
  "self_similar": ["similar item 1", "similar item 2", ...],
  ${isDeep ? `"deep_details": "Detailed information including manufacturing processes, materials, variations, cost factors, or deeper insights"` : ''}
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
        deep_details: parsed.deep_details,
      };

      setCenterNode(newNode);
      setCredits(prev => prev - 1);
    } catch (error) {
      console.error(error);
      alert('Could not connect to Grok API.');
    } finally {
      setIsLoading(false);
    }
  };

  const exploreNormal = () => {
    if (!searchQuery.trim()) return;
    callGrok(searchQuery, false);
  };

  const exploreDeep = () => {
    if (!searchQuery.trim()) return;
    callGrok(searchQuery, true);
  };

  const handleComponentClick = (comp: string) => {
    setSearchQuery(comp);
    callGrok(comp, false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
            <p className="text-muted-foreground">Explore anything • Break it down • Drill deeper</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-5 py-3 rounded-3xl">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-2xl">{credits}</span>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
            <Button variant="outline" className="gap-2">
              <Crown className="h-4 w-4" />
              Buy Credits
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-10">
          <Input
            placeholder="Search anything... (cheese burger, car, laptop, photosynthesis...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && exploreNormal()}
            className="py-7 text-lg"
          />
          <Button onClick={exploreNormal} disabled={isLoading} className="px-8">
            {isLoading ? 'Exploring...' : 'Explore'}
          </Button>
          <Button onClick={exploreDeep} disabled={isLoading} variant="default" className="px-8">
            Deep Query
          </Button>
        </div>

        {/* Single Info Panel */}
        {centerNode ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{centerNode.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div>
                <h4 className="font-semibold mb-2">What it is</h4>
                <p className="text-lg leading-relaxed">{centerNode.short_description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Main Function</h4>
                <p className="text-lg">{centerNode.main_function}</p>
              </div>

              {centerNode.deep_details && (
                <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-2xl">
                  <h4 className="font-semibold mb-3 text-blue-700">Deep Query Details</h4>
                  <p className="text-blue-800 dark:text-blue-300">{centerNode.deep_details}</p>
                </div>
              )}

              {/* Self-Similar */}
              {centerNode.self_similar?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Self-Similar / Variants</h4>
                  <div className="flex flex-wrap gap-2">
                    {centerNode.self_similar.map((item, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery(item);
                          callGrok(item, false);
                        }}
                      >
                        {item}
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

              <div className="flex gap-3 pt-6 border-t">
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
          <Card className="p-16 text-center">
            <p className="text-xl text-muted-foreground">Search something above to explore its components and details</p>
          </Card>
        )}
      </div>
    </div>
  );
}