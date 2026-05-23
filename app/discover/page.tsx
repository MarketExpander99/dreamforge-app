'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft, BookOpen, Share2, Plus } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  short_description: string;
  main_function: string;
  components: string[];
}

export default function DiscoverPage() {
  const [centerNode, setCenterNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Node[]>([]);

  const callGrok = async (topic: string) => {
    setIsLoading(true);
    try {
      const prompt = `You are a helpful exploration assistant. 
For the topic "${topic}", return ONLY valid JSON with this exact structure:
{
  "label": "${topic}",
  "short_description": "A clear, concise 1-2 sentence description",
  "main_function": "What this thing does or its purpose",
  "components": ["component1", "component2", "component3", ...] 
}
Give 6-10 key components or connected parts that make up or relate to this topic.`;

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
        short_description: parsed.short_description || 'No description available.',
        main_function: parsed.main_function || 'No function information available.',
        components: parsed.components || [],
      };

      setCenterNode(newNode);
      setHistory(prev => [newNode, ...prev].slice(0, 8));
    } catch (error) {
      console.error(error);
      alert('Could not connect to Grok API. Please check your /api/grok endpoint and XAI_API_KEY.');
    } finally {
      setIsLoading(false);
    }
  };

  const exploreTopic = (topic: string) => {
    if (!topic.trim()) return;
    callGrok(topic);
  };

  const handleComponentClick = (component: string) => {
    setSearchQuery(component);
    callGrok(component);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-foreground">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
            <p className="text-muted-foreground">Explore anything. Break it down. Drill deeper.</p>
          </div>

          {/* Search */}
          <div className="flex gap-3 mb-10 max-w-2xl">
            <Input
              placeholder="Search anything... (cheese burger, car, photosynthesis, laptop...)"
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
            {/* Main Visual / Info Area */}
            <div className="lg:col-span-7">
              <Card className="h-[620px] flex flex-col">
                <CardHeader>
                  <CardTitle>
                    {centerNode ? centerNode.label : 'Start Exploring'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-8 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-b-xl">
                  {centerNode ? (
                    <div className="max-w-lg text-center">
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {centerNode.short_description}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p className="text-xl">What would you like to explore?</p>
                      <p className="mt-4 text-sm">Type anything above and discover its parts.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info + Components */}
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
                      <h4 className="font-semibold mb-2">Main Function / Purpose</h4>
                      <p className="text-sm">{centerNode.main_function}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Components &amp; Connected Parts</h4>
                      <div className="flex flex-wrap gap-2">
                        {centerNode.components.map((comp, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            onClick={() => handleComponentClick(comp)}
                            className="text-sm"
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
                  <div className="max-w-xs">
                    <p className="text-muted-foreground">Search something above to see its components and drill deeper.</p>
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