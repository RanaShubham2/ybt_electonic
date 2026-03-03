import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { submitSupportRequest } from '../lib/supabase';

const SupportPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Try Supabase first
      const supaResult = await submitSupportRequest(name, email, message);
      
      if (supaResult.success) {
        toast.success('Message sent successfully (Supabase)!');
        setName('');
        setEmail('');
        setMessage('');
        return;
      }

      if (supaResult.fallback === false) {
        throw new Error(supaResult.error || 'Failed to send message');
      }

      // Fallback to local API if Supabase is not configured or fails
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      toast.success('Message sent successfully!');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
        <p className="text-zinc-500">Our team is here to support your digital journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xl font-bold mb-4">Common Questions</h3>
          <div className="space-y-4">
            {[
              "How do I download my products?",
              "What is your refund policy?",
              "Can I use these for client projects?",
              "Do you offer custom design services?"
            ].map((q, i) => (
              <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between group cursor-pointer">
                <span className="text-sm font-medium">{q}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xl font-bold mb-4">Send a Message</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="Your Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-5 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
            />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
            />
            <textarea 
              placeholder="How can we help?" 
              rows={4} 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full px-5 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            ></textarea>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
