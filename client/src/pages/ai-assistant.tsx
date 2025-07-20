import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import AIChat from '@/components/ai-assistant/ai-chat';
import { 
  Bot, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  MessageSquare, 
  Zap,
  Brain,
  Clock,
  Target,
  CheckCircle
} from 'lucide-react';

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');

  const features = [
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Smart Conversations",
      description: "Chat with AI for instant help with invoicing, payments, and business questions"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Invoice Generation",
      description: "Get AI-powered suggestions for invoice content, descriptions, and pricing"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Business Insights",
      description: "Analyze your invoice data and get actionable recommendations"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Payment Collection",
      description: "Professional advice on following up with clients and improving cash flow"
    }
  ];

  const useCases = [
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Quick Invoice Help",
      description: "Generate professional invoice descriptions and line items"
    },
    {
      icon: <Brain className="h-4 w-4" />,
      title: "Business Strategy",
      description: "Get advice on pricing, payment terms, and client management"
    },
    {
      icon: <Clock className="h-4 w-4" />,
      title: "Payment Follow-up",
      description: "Professional templates and strategies for overdue invoices"
    },
    {
      icon: <CheckCircle className="h-4 w-4" />,
      title: "Best Practices",
      description: "Learn industry standards and improve your invoicing process"
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Assistant</h1>
            <p className="text-muted-foreground">
              Your intelligent companion for invoice management and business growth
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by OpenAI
          </Badge>
          <Badge variant="outline">24/7 Available</Badge>
          <Badge variant="outline">Business Expert</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="examples">Use Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <AIChat 
            initialContext={user ? `User: ${user.email}` : undefined}
            onSuggestionApply={(content) => {
              // You can implement logic to apply AI suggestions to forms
              console.log('Apply suggestion:', content);
            }}
          />
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {feature.icon}
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Start a Conversation</h4>
                    <p className="text-sm text-muted-foreground">
                      Switch to the AI Chat tab and type your question or use quick actions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Get Instant Help</h4>
                    <p className="text-sm text-muted-foreground">
                      Ask about invoice creation, payment strategies, or business advice
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Apply Suggestions</h4>
                    <p className="text-sm text-muted-foreground">
                      Copy AI responses or apply them directly to your invoices
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {useCases.map((useCase, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {useCase.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{useCase.title}</h4>
                      <p className="text-sm text-muted-foreground">{useCase.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Example Questions</CardTitle>
              <CardDescription>
                Try asking the AI Assistant these types of questions:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">💡 "Help me write a professional invoice description for web development services"</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">💡 "What should I do about an invoice that's 45 days overdue?"</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">💡 "How can I improve my cash flow based on my invoice data?"</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">💡 "What are the best payment terms for a consulting business?"</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">💡 "Generate a professional follow-up email for a late payment"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}