'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
// Add Lattice component import when ready

export default function DiscoverPage() {
  const { profile, currentNode, setCurrentNode } = useUser();
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);

  const handleChatSubmit = async (question: string) => {
    // TODO: Call Grok API with full context (profile + currentNode)
    setChatMessages(prev => [...prev, { role: 'user', content: question }]);
    // Placeholder response
    setChatMessages(prev => [...prev, { role: 'assistant', content: 'Thinking about ' + (currentNode || 'the lattice') + '...' }]);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Lattice Area */}
      <div className="flex-1 p-4">
        <h1 className="text-3xl font-bold">Discover the Lattice</h1>
        <p className="text-muted-foreground">Current node: {currentNode || 'None'}</p>
        {/* E8 Lattice component goes here */}
      </div>

      {/* Context-Aware Chat Panel (Bottom) */}
      <div className="border-t bg-background p-4">
        <h3 className="font-medium mb-2">Ask about {currentNode || 'anything in the lattice'}</h3>
        <div className="h-64 overflow-y-auto border rounded-lg p-3 mb-3 bg-muted/50">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                {msg.content}
              </span>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).chat.value;
            handleChatSubmit(input);
            (e.target as HTMLFormElement).reset();
          }}
          className="flex gap-2"
        >
          <input
            name="chat"
            type="text"
            placeholder="Ask a question about this node..."
            className="flex-1 border rounded-xl px-4 py-3"
          />
          <button type="submit" className="bg-primary text-primary-foreground px-8 rounded-xl">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}