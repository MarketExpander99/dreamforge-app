'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Node {
  label: string;
  short_description: string;
  main_function: string;
  components: string[];
  self_similar: string[];
  deep_details?: string;
}

export default function GrokipediaPage({ params }: { params: { slug: string } }) {
  const [node, setNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const topic = params.slug.replace(/-/g, ' ');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const prompt = `You are a helpful exploration assistant.
For the topic "${topic}", return ONLY valid JSON with this structure:

{
  "label": "${topic}",
  "short_description": "Clear 1-2 sentence description",
  "main_function": "What this thing does or its purpose",
  "components": ["component1", "component2", ...],
  "self_similar": ["similar item 1", "similar item 2", ...],
  "deep_details": "Detailed information including manufacturing processes, materials, variations, cost factors, or deeper insights"
}`;

        const response = await fetch('/api/grok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        const rawData = await response.json();
        const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

        setNode({
          label: parsed.label || topic,
          short_description: parsed.short_description || "No description available.",
          main_function: parsed.main_function || "No function information available.",
          components: Array.isArray(parsed.components) ? parsed.components : [],
          self_similar: Array.isArray(parsed.self_similar) ? parsed.self_similar : [],
          deep_details: parsed.deep_details,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [topic]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Navigation />
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!node) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl">Article not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl">{node.label}</CardTitle>
            <p className="text-muted-foreground">Grokipedia Article</p>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            <div>
              <h4 className="font-semibold mb-2 text-xl">What it is</h4>
              <p className="text-lg leading-relaxed">{node.short_description}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-xl">Main Function</h4>
              <p className="text-lg">{node.main_function}</p>
            </div>

            {node.deep_details && (
              <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-2xl">
                <h4 className="font-semibold mb-3 text-blue-700">Deep Details</h4>
                <p className="text-blue-800 dark:text-blue-300">{node.deep_details}</p>
              </div>
            )}

            {node.self_similar?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-xl">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  {node.self_similar.map((item, i) => (
                    <Button key={i} variant="outline" size="sm">
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {node.components?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-xl">Components</h4>
                <div className="flex flex-wrap gap-2">
                  {node.components.map((comp, i) => (
                    <Button key={i} variant="outline" size="sm">
                      {comp}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}