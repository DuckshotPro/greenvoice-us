import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle,
  Bot,
  Globe,
  Zap,
  Shield,
  HeadphonesIcon
} from "lucide-react";
import { SupportChat } from "@/components/chat/support-chat";

export default function SupportChatPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <HeadphonesIcon className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Customer Support</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Get instant help with your invoices, payments, and account questions through our AI-powered support system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Chat Widget */}
        <div className="lg:col-span-2">
          <SupportChat className="h-[600px]" />
        </div>

        {/* Support Features & Info */}
        <div className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Support Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Bot className="h-5 w-5 mt-0.5 text-blue-500" />
                <div>
                  <div className="font-medium">AI-Powered Assistance</div>
                  <div className="text-sm text-muted-foreground">
                    Instant responses powered by advanced AI for common questions
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 text-green-500" />
                <div>
                  <div className="font-medium">24/7 Availability</div>
                  <div className="text-sm text-muted-foreground">
                    Get help anytime, anywhere with our always-on chat system
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 mt-0.5 text-purple-500" />
                <div>
                  <div className="font-medium">Multi-Language Support</div>
                  <div className="text-sm text-muted-foreground">
                    Support available in English and other Caribbean languages
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 mt-0.5 text-orange-500" />
                <div>
                  <div className="font-medium">Secure & Private</div>
                  <div className="text-sm text-muted-foreground">
                    All conversations are encrypted and confidential
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Common Support Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Invoice Questions</span>
                  <Badge variant="secondary">Most Common</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Payment Issues</span>
                  <Badge variant="secondary">High Priority</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Currency & Rates</span>
                  <Badge variant="outline">New</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Account Settings</span>
                  <Badge variant="outline">General</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Technical Support</span>
                  <Badge variant="outline">Technical</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Response Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Assistant</span>
                  <Badge className="bg-green-500">Instant</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">General Inquiries</span>
                  <Badge variant="secondary">&lt; 1 hour</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Technical Issues</span>
                  <Badge variant="secondary">&lt; 4 hours</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Account Issues</span>
                  <Badge variant="secondary">&lt; 2 hours</Badge>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Premium Support:</strong> Upgrade to Premium for priority support 
                  with guaranteed 30-minute response times.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                View All Conversations
              </Button>
              
              <Button variant="outline" className="w-full justify-start" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Order Status
              </Button>
              
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Contact Human Agent
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}