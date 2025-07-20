import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Sparkles, Loader2, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { sendMessageToAI, ChatMessage, generateInvoiceContent, getPaymentCollectionAdvice, generateBusinessInsights } from '@/lib/openai-service';

interface AIChatProps {
  initialContext?: string;
  onSuggestionApply?: (content: string) => void;
}

export default function AIChat({ initialContext, onSuggestionApply }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if OpenAI API key is available
    const hasApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    setIsConnected(!!hasApiKey);
    
    if (!hasApiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key to use the AI Assistant.",
        variant: "destructive"
      });
    }

    // Add initial welcome message
    if (hasApiKey) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hello! I'm your AI Assistant for GreenVoice Invoice Management. I can help you with:

• **Invoice Creation** - Generate professional content and descriptions
• **Business Advice** - Payment collection strategies and best practices  
• **Financial Insights** - Analysis of your invoice data and cash flow
• **General Questions** - Any business or invoicing questions

${initialContext ? `\n**Context**: ${initialContext}` : ''}

How can I assist you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [initialContext, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isConnected) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToAI([...messages, userMessage]);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = async (action: string) => {
    setIsLoading(true);
    try {
      let response = '';
      
      switch (action) {
        case 'invoice-help':
          response = await generateInvoiceContent('general business', 'professional services');
          break;
        case 'payment-advice':
          response = await getPaymentCollectionAdvice(30, 'small business');
          break;
        case 'business-insights':
          response = await generateBusinessInsights({
            totalInvoices: 50,
            paidInvoices: 35,
            overdueInvoices: 10,
            averagePaymentTime: 25,
            topServices: ['Consulting', 'Web Development', 'Design']
          });
          break;
        default:
          response = 'I can help with that! Please provide more specific details about what you need assistance with.';
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error with quick action:', error);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard.",
    });
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="mb-4">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-lg font-semibold">AI Assistant Not Connected</h3>
            <p className="text-muted-foreground mt-2">
              To use the AI Assistant, you need to configure your OpenAI API key.
            </p>
          </div>
          <Badge variant="secondary">API Key Required</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Assistant
          <Badge variant="outline" className="ml-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Quick Actions */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('invoice-help')}
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Invoice Help
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('payment-advice')}
              disabled={isLoading}
            >
              <Bot className="h-4 w-4 mr-1" />
              Payment Advice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('business-insights')}
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Business Insights
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className={`w-8 h-8 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                  <AvatarFallback>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="h-6 text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      {onSuggestionApply && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSuggestionApply(message.content)}
                          className="h-6 text-xs"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="inline-block p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator />

        {/* Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}