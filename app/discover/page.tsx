'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, BookOpen, Plus, CreditCard, Crown, Loader2 } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  short_description: string;
  main_function: string;
  components: string[];
  self_similar: string[];
  deep_details?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function DiscoverPage() {
  const [centerNode, setCenterNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(8);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const callGrok = async (topic: string, isDeep: boolean = false) => {
    if (credits <= 0) {
      alert("You've used your free credits for today.");
      return;
    }

    setIsLoading(true);
    setCenterNode(null);

    try {
      const prompt = `You are a helpful exploration assistant.\nFor the topic "${topic}", return ONLY valid JSON with this exact structure...`;

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const rawData = await response.json();
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

      const newNode: Node = {
        id: Date.now().toString(),
        label: parsed.label || topic,
        short_description: parsed.short_description || "No description available.",
        main_function: parsed.main_function || "No function information available.",
        components: Array.isArray(parsed.components) ? parsed.components : [],
        self_similar: Array.isArray(parsed.self_similar) ? parsed.self_similar : [],
        deep_details: parsed.deep_details,
      };

      setCenterNode(newNode);
      setCredits(prev => prev - 1);
      setChatMessages([]);
    } catch (error) {
      console.error(error);
      alert("Failed to explore topic.");
    } finally {
      setIsLoading(false);
    }
  };

  const exploreNormal = () => callGrok(searchQuery, false);
  const exploreDeep = () => callGrok(searchQuery, true);

  const handleComponentClick = (comp: string) => {
    setSearchQuery(comp);
    callGrok(comp, false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !centerNode) return;

    const userMsg = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const currentQuestion = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `The current topic is "${centerNode.label}". Answer this question helpfully: ${currentQuestion}`
        }),
      });

      const raw = await response.json();
      const answer = typeof raw === 'string' ? raw : raw.content || "Sorry, I couldn't generate a response.";
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
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
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <Input
            placeholder="Search anything... (cheese burger, car, laptop...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && exploreNormal()}
            className="py-7 text-lg"
          />
          <div className="flex gap-3">
            <Button 
              onClick={exploreNormal} 
              disabled={isLoading} 
              className="px-8 whitespace-nowrap"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Explore'}
            </Button>
            <Button 
              onClick={exploreDeep} 
              disabled={isLoading} 
              variant="default" 
              className="px-8 whitespace-nowrap"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Deep Query'}
            </Button>
          </div>
        </div>

        {/* Main Result */}
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

              {centerNode.self_similar?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Self-Similar / Variants</h4>
                  <div className="flex flex-wrap gap-2">
                    {centerNode.self_similar.map((item, i) => (
                      <Button key={i} variant="outline" size="sm" onClick={() => { setSearchQuery(item); callGrok(item, false); }}>
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Components & Connected Parts</h4>
                <div className="flex flex-wrap gap-2">
                  {centerNode.components.map((comp, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => handleComponentClick(comp)}>
                      {comp}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button variant="outline" className="gap-2 flex-1" asChild>
                  <a href={`https://grokipedia.com/search?q=${encodeURIComponent(centerNode.label)}`} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4" />
                    View on Grokipedia
                  </a>
                </Button>
                <Button variant="outline" className="gap-2 flex-1" onClick={() => alert("Add to Learning Path - Coming soon!")}>
                  <Plus className="h-4 w-4" />
                  Add to Learning Path
                </Button>
              </div>

              {/* Chat Section */}
              <div className="pt-8 border-t">
                <h4 className="font-semibold mb-3">Ask a question about {centerNode.label}</h4>
                
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 max-h-72 overflow-y-auto mb-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Ask anything about this topic...</p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user' ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-800 border'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-zinc-800 border px-4 py-3 rounded-2xl flex items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        Talking to Grok...
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ask anything about this topic..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <Button onClick={sendChatMessage} disabled={isChatLoading}>
                    {isChatLoading ? <Loader2 className="animate-spin" /> : 'Send'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-20 text-center">
            <p className="text-xl text-muted-foreground">Search something above to begin exploring</p>
          </Card>
        )}
      </div>
    </div>
  );
}