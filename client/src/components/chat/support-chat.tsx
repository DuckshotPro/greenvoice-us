import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Send, 
  User, 
  Bot, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SupportMessage {
  id: number;
  conversationId: number;
  senderType: 'client' | 'agent' | 'ai_assistant' | 'system';
  senderName: string;
  messageContent: string;
  messageType: 'text' | 'file' | 'image' | 'invoice_share' | 'system';
  aiGenerated: boolean;
  timestamp: string;
  readByClient: boolean;
  readByAgent: boolean;
}

interface SupportConversation {
  id: number;
  clientEmail: string;
  clientName?: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  relatedInvoiceId?: number;
  createdAt: string;
  lastMessageAt: string;
}

interface SupportChatProps {
  className?: string;
  relatedInvoiceId?: number;
}

export function SupportChat({ className, relatedInvoiceId }: SupportChatProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  // New conversation form state
  const [newConversationForm, setNewConversationForm] = useState({
    clientEmail: '',
    clientName: '',
    subject: '',
    initialMessage: ''
  });

  // Get conversation details
  const { data: conversationData, isLoading: loadingConversation } = useQuery({
    queryKey: ['support-conversation', activeConversation],
    queryFn: () => apiRequest(`/api/chat/conversations/${activeConversation}`),
    enabled: !!activeConversation,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Start new conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        relatedInvoiceId
      })
    }),
    onSuccess: (response) => {
      setActiveConversation(response.conversation.id);
      setIsStartingConversation(false);
      setNewConversationForm({
        clientEmail: '',
        clientName: '',
        subject: '',
        initialMessage: ''
      });
      toast({
        title: "Support conversation started",
        description: "We'll respond to your message shortly."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start conversation",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['support-conversation', activeConversation] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationData?.messages]);

  const handleStartConversation = () => {
    if (!newConversationForm.clientEmail || !newConversationForm.subject || !newConversationForm.initialMessage) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    startConversationMutation.mutate(newConversationForm);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    sendMessageMutation.mutate({
      conversationId: activeConversation,
      messageContent: newMessage,
      senderName: conversationData?.conversation?.clientName || conversationData?.conversation?.clientEmail,
      senderType: 'client'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getSenderIcon = (senderType: string, aiGenerated: boolean) => {
    if (aiGenerated || senderType === 'ai_assistant') {
      return <Bot className="h-4 w-4" />;
    }
    if (senderType === 'client') {
      return <User className="h-4 w-4" />;
    }
    return <MessageCircle className="h-4 w-4" />;
  };

  if (!activeConversation && !isStartingConversation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Customer Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">
              Need help with your invoice or have questions?
            </div>
            <Button onClick={() => setIsStartingConversation(true)}>
              Start Support Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isStartingConversation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Start Support Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newConversationForm.clientEmail}
                onChange={(e) => setNewConversationForm(prev => ({
                  ...prev,
                  clientEmail: e.target.value
                }))}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                value={newConversationForm.clientName}
                onChange={(e) => setNewConversationForm(prev => ({
                  ...prev,
                  clientName: e.target.value
                }))}
                placeholder="Your name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={newConversationForm.subject}
              onChange={(e) => setNewConversationForm(prev => ({
                ...prev,
                subject: e.target.value
              }))}
              placeholder="What can we help you with?"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Initial Message *</Label>
            <Textarea
              id="message"
              value={newConversationForm.initialMessage}
              onChange={(e) => setNewConversationForm(prev => ({
                ...prev,
                initialMessage: e.target.value
              }))}
              placeholder="Describe your question or issue..."
              rows={4}
            />
          </div>

          {relatedInvoiceId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Related to Invoice #{relatedInvoiceId}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={handleStartConversation}
              disabled={startConversationMutation.isPending}
              className="flex-1"
            >
              {startConversationMutation.isPending ? 'Starting...' : 'Start Conversation'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsStartingConversation(false)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingConversation) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const conversation = conversationData?.conversation;
  const messages = conversationData?.messages || [];

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{conversation?.subject}</CardTitle>
          <Badge className={getStatusColor(conversation?.status)}>
            {conversation?.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Conversation with {conversation?.clientName || conversation?.clientEmail}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Messages */}
        <ScrollArea className="h-96 px-6">
          <div className="space-y-4">
            {messages.map((message: SupportMessage) => (
              <div 
                key={message.id} 
                className={`flex gap-3 ${
                  message.senderType === 'client' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.senderType === 'client' 
                    ? 'bg-blue-500 text-white' 
                    : message.aiGenerated 
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-500 text-white'
                }`}>
                  {getSenderIcon(message.senderType, message.aiGenerated)}
                </div>
                
                <div className={`flex-1 max-w-xs ${
                  message.senderType === 'client' ? 'text-right' : ''
                }`}>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <span>{message.senderName}</span>
                    {message.aiGenerated && (
                      <Badge variant="outline" className="text-xs">
                        AI
                      </Badge>
                    )}
                    <span>•</span>
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    message.senderType === 'client' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.messageType === 'system' ? (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span className="italic">{message.messageContent}</span>
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">
                        {message.messageContent}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <Separator />
        
        {/* Message Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-0 resize-none"
              rows={2}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </CardContent>
    </Card>
  );
}