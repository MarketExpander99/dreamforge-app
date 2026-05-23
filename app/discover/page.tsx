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
  const [isDeepQueryMode, setIsDeepQueryMode] = useState(false);
  const [credits, setCredits] = useState(8);

  const callGrok = async (topic: string, deep: boolean = false) => {
    if (credits <= 0) {
      alert("You've used your free credits for today. Buy more to continue.");
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `You are a helpful exploration assistant.
For the topic "${topic}", return ONLY valid JSON with this exact structure:

{
  "label": "${topic}",
  "short_description": "Clear 1-2 sentence description",
  "main_function": "What this thing does or its purpose",
  "components": ["component1", "component2", ...],
  "self_similar": ["similar item 1", "similar item 2", ...],
  ${deep ? `"deep_details": "Detailed breakdown including manufacturing processes, materials, variations, cost factors, or advanced insights"` : ''}
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
      setIsDeepQueryMode(deep);
    } catch (error) {
      console.error(error);
      alert('Could not connect to Grok API.');
    } finally {
      setIsLoading(false);
    }
  };

  const exploreTopic = (topic: string) => {
    if (!topic.trim()) return;
    callGrok(topic, false);
  };

  const handleDeepQuery = () => {
    if (!centerNode) return;
    callGrok(centerNode.label, true);
  };

  const handleComponentClick = (comp: string) => {
    setSearchQuery(comp);
    callGrok(comp, false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
            <p className="text-muted-foreground">Explore anything • Break it down • Drill deeper</p>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-5 py-3 rounded-3xl">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-2xl">{credits}</span>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => alert('Payment gateway coming soon!')}>
              <Crown className="h-4 w-4" />
              Buy Credits
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-10 max-w-3xl">
          <Input
            placeholder="Search anything... (cheese burger, car, laptop, photosynthesis...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && exploreTopic(searchQuery)}
            className="py-7 text-lg"
          />
          <Button 
            onClick={() => exploreTopic(searchQuery)} 
            disabled={isLoading || credits <= 0}
            className="px-12 text-lg"
          >
            {isLoading ? 'Exploring...' : 'Explore'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - Much wider now */}
          <div className="lg:col-span-8">
            <Card className="min-h-[580px] flex flex-col">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-2xl">
                  {centerNode ? centerNode.label : 'Start Exploring'}
                </CardTitle>
                {centerNode && (
                  <Button 
                    onClick={handleDeepQuery}
                    variant="default"
                    className="gap-2"
                  >
                    Deep Query
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-b-xl">
                {centerNode ? (
                  <div className="max-w-2xl text-center">
                    <p className="text-xl leading-relaxed">{centerNode.short_description}</p>
                    {centerNode.deep_details && (
                      <p className="mt-8 text-blue-600 dark:text-blue-400 text-left">{centerNode.deep_details}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="text-2xl">What would you like to explore?</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
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
              <Card className="h-full flex items-center justify-center text-center p-12">
                <p className="text-muted-foreground">Search something to see its breakdown</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}