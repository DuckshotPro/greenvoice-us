import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, HelpCircle, Search } from "lucide-react";

// FAQ categories and entries
const faqData = {
  payments: [
    {
      question: "What payment methods are supported?",
      answer: "Our platform uses Stripe to process payments. We currently support all major credit and debit cards including Visa, Mastercard, American Express, and Discover. ACH transfers are also available for US-based customers."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, we take security seriously. We never store your card details on our servers. All payment processing is handled securely by Stripe, which is PCI DSS Level 1 compliant (the highest level of certification)."
    },
    {
      question: "Why was my card declined?",
      answer: "Cards can be declined for various reasons including insufficient funds, expired cards, incorrect security codes, or fraud suspicions. Please verify your card details and contact your bank if the issue persists. For your security, we cannot see the specific reason for declines."
    },
    {
      question: "How do refunds work?",
      answer: "Refunds for premium subscription payments can be processed within 30 days of purchase. Please contact our support team to initiate a refund. Refunds typically take 5-10 business days to appear on your statement."
    },
    {
      question: "Can I update my payment method?",
      answer: "Yes, you can update your payment method at any time in your account settings. Simply navigate to the 'Billing' section and select 'Update payment method'."
    },
    {
      question: "Do you offer recurring billing for invoices?",
      answer: "Yes, our platform supports creating recurring invoice templates that generate and send invoices automatically based on your specified schedule (monthly, quarterly, etc.)."
    }
  ],
  technical: [
    {
      question: "What browsers are supported?",
      answer: "Our application works best with modern browsers including Chrome, Firefox, Safari, and Edge. For optimal performance, we recommend keeping your browser updated to the latest version."
    },
    {
      question: "Can I access my invoices offline?",
      answer: "Any invoices you've downloaded as PDFs will be accessible offline. However, creating new invoices or accessing your account requires an internet connection."
    },
    {
      question: "How secure is my data?",
      answer: "We use industry-standard encryption for all data transmission. Your invoice data is stored securely in our database with regular backups and strict access controls."
    },
    {
      question: "What file formats are supported for exporting invoices?",
      answer: "Currently, we support exporting invoices as PDF files, which provides the most consistent display and printing experience across devices."
    }
  ],
  account: [
    {
      question: "How do I upgrade to premium?",
      answer: "You can upgrade to our premium plan on the Premium page. We offer both subscription options and a way to earn temporary premium access by watching short advertisements."
    },
    {
      question: "What happens if my premium subscription expires?",
      answer: "When your premium subscription expires, your account will revert to the free plan. Any invoices or templates you've created will remain accessible, but premium features will no longer be available."
    },
    {
      question: "Can I have multiple users on my account?",
      answer: "Not currently. Each account is designed for individual use. For business needs requiring multiple users, please contact our support team to discuss enterprise options."
    }
  ],
  stripe: [
    {
      question: "Why do I need to provide a ZIP/postal code?",
      answer: "Stripe requires your postal code for address verification, which helps prevent fraud and ensures your card issuer approves the transaction. This is a security measure required by most payment processors."
    },
    {
      question: "I'm seeing 'Authentication Required' during payment, what does this mean?",
      answer: "This indicates your bank requires Strong Customer Authentication (SCA). It's part of regulations like PSD2 in Europe that require additional verification for online payments. Simply follow the prompts to authenticate with your bank."
    },
    {
      question: "Does Stripe store my card information?",
      answer: "When you make a payment, Stripe securely stores your payment information following PCI compliance standards. Your card details are never stored on our servers. Stripe uses tokenization to securely handle your payment information."
    },
    {
      question: "Why do I see a temporary authorization charge?",
      answer: "Stripe may place a temporary authorization hold (usually $1 or less) to verify your card is valid. This is not an actual charge and will disappear from your statement, typically within a few days."
    },
    {
      question: "Can I use Apple Pay or Google Pay?",
      answer: "Yes, if you're using a supported browser and device, you can use Apple Pay or Google Pay for a faster checkout experience. These options will automatically appear on the payment screen if available on your device."
    },
    {
      question: "I'm experiencing an error with my payment. What should I do?",
      answer: "If you encounter a payment error, first check that your card details are entered correctly. Ensure your card isn't expired or reaching its limit. If problems persist, your bank may be blocking the transaction for security reasons. Contact your bank or try a different payment method."
    }
  ]
};

// Search functionality to find FAQs by keyword
function searchFaqs(query: string) {
  if (!query.trim()) return [];
  
  const results: Array<{ category: string; question: string; answer: string }> = [];
  const normalizedQuery = query.toLowerCase();
  
  Object.entries(faqData).forEach(([category, items]) => {
    items.forEach(item => {
      if (
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery)
      ) {
        results.push({
          category,
          question: item.question,
          answer: item.answer
        });
      }
    });
  });
  
  return results;
}

const FaqPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = searchFaqs(searchQuery);
  
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold tracking-tight"
        >
          Help & Troubleshooting
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-2 text-muted-foreground"
        >
          Find answers to common questions about using our invoice platform
        </motion.p>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for answers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>
      
      {searchQuery ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="search-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  {searchResults.length} 
                  {searchResults.length === 1 ? ' result' : ' results'} for "{searchQuery}"
                </CardTitle>
              </CardHeader>
              <CardContent>
                {searchResults.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {searchResults.map((result, index) => (
                      <AccordionItem value={`search-${index}`} key={`search-${index}`}>
                        <AccordionTrigger>
                          <div className="flex items-start">
                            <span className="text-sm font-medium text-left">{result.question}</span>
                            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">
                              {result.category}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground">{result.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-6">
                    <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-4 text-muted-foreground">
                      No results found. Try a different search term or browse the categories below.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="faq-tabs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Tabs defaultValue="stripe">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="stripe" className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Issues
                </TabsTrigger>
                <TabsTrigger value="payments">General Payments</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="stripe">
                <Card>
                  <CardHeader>
                    <CardTitle>Stripe Payment Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqData.stripe.map((item, index) => (
                        <AccordionItem value={`stripe-${index}`} key={`stripe-${index}`}>
                          <AccordionTrigger>{item.question}</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground">{item.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle>General Payment Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqData.payments.map((item, index) => (
                        <AccordionItem value={`payment-${index}`} key={`payment-${index}`}>
                          <AccordionTrigger>{item.question}</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground">{item.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="technical">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqData.technical.map((item, index) => (
                        <AccordionItem value={`tech-${index}`} key={`tech-${index}`}>
                          <AccordionTrigger>{item.question}</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground">{item.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqData.account.map((item, index) => (
                        <AccordionItem value={`account-${index}`} key={`account-${index}`}>
                          <AccordionTrigger>{item.question}</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground">{item.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-12 text-center p-6 bg-secondary/50 rounded-lg"
      >
        <h2 className="font-semibold text-lg mb-2">Still need help?</h2>
        <p className="text-muted-foreground">
          If you couldn't find an answer to your question, feel free to contact our support team.
        </p>
        <div className="mt-4">
          <a href="mailto:support@example.com" className="text-primary hover:underline">
            support@example.com
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default FaqPage;