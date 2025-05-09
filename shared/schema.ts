import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for recurring invoice frequency and status
export const recurringFrequencyEnum = pgEnum('recurring_frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'scheduled', 'sent', 'paid', 'void', 'overdue']);

// Subscription plan types
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'basic', 'premium', 'enterprise']);

// Progress billing types
export const progressBillingTypeEnum = pgEnum('progress_billing_type', ['percentage', 'fixed', 'milestone']);
export const milestoneStatusEnum = pgEnum('milestone_status', ['pending', 'current', 'completed', 'invoiced', 'paid']);

// Business owner/sender
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),  // Allow null for OAuth users
  email: text("email").notNull().default(''),
  fullName: text("full_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  // OAuth fields
  oauthId: text("oauth_id"),
  oauthProvider: text("oauth_provider"), // google, facebook, github
  oauthData: jsonb("oauth_data"), // Additional OAuth data
  // Subscription and premium info
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").default("free"),
  subscriptionExpiry: timestamp("subscription_expiry"),
  premiumDaysRemaining: integer("premium_days_remaining").default(0),
  lastAdViewTime: timestamp("last_ad_view_time"),
  lastAdDaysAwarded: integer("last_ad_days_awarded").default(0),
  totalInvoicesSent: integer("total_invoices_sent").default(0),
  registeredAt: timestamp("registered_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  isAdmin: boolean("is_admin").default(false),
  brandingSettings: text("branding_settings"), // Stored as JSON string
  logoUrl: text("logo_url"), // URL to user's uploaded or generated logo
  customTemplateId: text("custom_template_id"), // ID of preferred invoice template
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  subscriptionPlan: true,
  subscriptionExpiry: true,
  premiumDaysRemaining: true, 
  lastAdViewTime: true,
  lastAdDaysAwarded: true,
  totalInvoicesSent: true,
  registeredAt: true,
  verifiedAt: true,
  isAdmin: true,
});

// Line item in an invoice
export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  rate: doublePrecision("rate").notNull(),
  amount: doublePrecision("amount").notNull(),
});

export const insertLineItemSchema = createInsertSchema(lineItems).omit({
  id: true,
});

// Coupon codes
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // 'percentage' or 'fixed'
  value: doublePrecision("value").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to"),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoice
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  discountType: text("discount_type"), // 'percentage', 'fixed', or 'coupon'
  discountValue: doublePrecision("discount_value").default(0),
  discountTotal: doublePrecision("discount_total").default(0),
  couponCode: text("coupon_code"),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  currency: text("currency").notNull().default("USD"),
  
  // Sender details
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderAddress: text("sender_address").notNull(),
  senderPhone: text("sender_phone").notNull(),
  
  // Client details
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientAddress: text("client_address").notNull(),
  
  // Financial details
  subtotal: doublePrecision("subtotal").notNull(),
  taxRate: doublePrecision("tax_rate").notNull().default(0),
  taxAmount: doublePrecision("tax_amount").notNull().default(0),
  total: doublePrecision("total").notNull(),
  
  // Additional info
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Invoice status
  status: invoiceStatusEnum("status").default("draft"),
  
  // Scheduled sending info
  scheduledSendDate: timestamp("scheduled_send_date"),
  sentAt: timestamp("sent_at"),
  
  // Recurring template reference (if this is an invoice generated from a recurring template)
  recurringTemplateId: integer("recurring_template_id"),
  
  // Progress billing reference (if this is part of a progress billing contract)
  progressContractId: integer("progress_contract_id"),
  milestoneId: integer("milestone_id"),

  // Payment info
  paidAt: timestamp("paid_at"),
  paymentMethod: text("payment_method"),
  
  // Sharing info
  shareableLink: text("shareable_link"),
});

// Recurring Invoice Templates
export const recurringTemplates = pgTable("recurring_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  
  // Base invoice data (template)
  invoicePrefix: text("invoice_prefix").notNull(), // For generating invoice numbers
  currency: text("currency").notNull().default("USD"),
  
  // Sender details
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderAddress: text("sender_address").notNull(),
  senderPhone: text("sender_phone").notNull(),
  
  // Client details
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientAddress: text("client_address").notNull(),
  
  // Financial template
  taxRate: doublePrecision("tax_rate").notNull().default(0),
  notes: text("notes"),
  
  // Recurring settings
  frequency: recurringFrequencyEnum("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // Optional end date
  nextInvoiceDate: timestamp("next_invoice_date").notNull(),
  dayOfMonth: integer("day_of_month"), // For monthly/quarterly/yearly
  dayOfWeek: integer("day_of_week"), // For weekly (0 = Sunday, 6 = Saturday)
  
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastGeneratedAt: timestamp("last_generated_at"),
});

// Template Line Items - reusable items for recurring invoices
export const templateLineItems = pgTable("template_line_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  rate: doublePrecision("rate").notNull(),
  amount: doublePrecision("amount").notNull(),
});

// Scheduled Invoices Queue - for processing scheduled invoices
export const scheduledInvoices = pgTable("scheduled_invoices", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(), // Reference to the actual invoice
  sendDate: timestamp("send_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, sent, failed
  retryCount: integer("retry_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  planType: subscriptionPlanEnum("plan_type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  billingCycle: text("billing_cycle").notNull(), // monthly, quarterly, yearly
  maxMonthlyInvoices: integer("max_monthly_invoices").notNull(),
  maxClients: integer("max_clients").notNull(),
  maxTemplates: integer("max_templates").notNull(),
  featuresJson: jsonb("features_json").notNull(), // Array of included features
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Subscription transactions
export const subscriptionTransactions = pgTable("subscription_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  transactionType: text("transaction_type").notNull(), // purchase, renewal, refund, upgrade, downgrade
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(), // pending, completed, failed, refunded
  paymentMethod: text("payment_method"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  metadata: jsonb("metadata"), // Additional transaction data
});

// Ad-rewards tracking
export const adRewards = pgTable("ad_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rewardType: text("reward_type").notNull(), // premium_day, feature_unlock, etc
  daysAwarded: integer("days_awarded").notNull().default(1),
  featureUnlocked: text("feature_unlocked"),
  viewDate: timestamp("view_date").defaultNow(),
  expiryDate: timestamp("expiry_date").notNull(),
  adProvider: text("ad_provider"),
  adCampaignId: text("ad_campaign_id"),
  metadata: jsonb("metadata"), // Additional reward data
});

// Progress billing contract
export const progressContracts = pgTable("progress_contracts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Client & project info
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientAddress: text("client_address").notNull(),
  projectName: text("project_name").notNull(),
  projectDescription: text("project_description"),
  
  // Contract details
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  contractNumber: text("contract_number").notNull(),
  totalValue: doublePrecision("total_value").notNull(),
  remainingValue: doublePrecision("remaining_value").notNull(),
  invoicedValue: doublePrecision("invoiced_value").default(0),
  paidValue: doublePrecision("paid_value").default(0),
  currency: text("currency").notNull().default("USD"),
  
  // Progress billing settings
  billingType: progressBillingTypeEnum("billing_type").notNull().default("milestone"),
  paymentTerms: text("payment_terms"),
  taxRate: doublePrecision("tax_rate").default(0),
  
  // Status and tracking
  isActive: boolean("is_active").default(true),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  attachmentUrls: jsonb("attachment_urls").default([]), // URLs to contract documents
});

// Milestones for progress billing
export const progressMilestones = pgTable("progress_milestones", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Milestone details
  dueDate: timestamp("due_date"),
  orderIndex: integer("order_index").notNull(), // For ordering milestones
  
  // Financial details
  amount: doublePrecision("amount").notNull(),
  percentOfTotal: doublePrecision("percent_of_total"), // For percentage-based progress billing
  
  // Status and tracking
  status: milestoneStatusEnum("status").default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  invoicedAt: timestamp("invoiced_at"),
  paidAt: timestamp("paid_at"),
  invoiceId: integer("invoice_id"), // Reference to the invoice if generated
  
  // Additional info
  deliverables: jsonb("deliverables").default([]), // List of specific deliverables
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  shareableLink: true,
  status: true,
  scheduledSendDate: true,
  sentAt: true,
  recurringTemplateId: true,
  progressContractId: true, // Omit progress billing fields
  milestoneId: true,
  paidAt: true,
  paymentMethod: true,
});

export const insertTemplateLineItemSchema = createInsertSchema(templateLineItems).omit({
  id: true,
});

export const insertRecurringTemplateSchema = createInsertSchema(recurringTemplates).omit({
  id: true,
  createdAt: true,
  lastGeneratedAt: true,
  isActive: true,
});

export const insertScheduledInvoiceSchema = createInsertSchema(scheduledInvoices).omit({
  id: true,
  createdAt: true,
  status: true,
  retryCount: true,
  errorMessage: true,
  processedAt: true,
});

// Basic types based on the schema
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type LineItem = typeof lineItems.$inferSelect;

export type InsertTemplateLineItem = z.infer<typeof insertTemplateLineItemSchema>;
export type TemplateLineItem = typeof templateLineItems.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertRecurringTemplate = z.infer<typeof insertRecurringTemplateSchema>;
export type RecurringTemplate = typeof recurringTemplates.$inferSelect;

export type InsertScheduledInvoice = z.infer<typeof insertScheduledInvoiceSchema>;
export type ScheduledInvoice = typeof scheduledInvoices.$inferSelect;

// Subscription related schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const insertSubscriptionTransactionSchema = createInsertSchema(subscriptionTransactions).omit({
  id: true,
  transactionDate: true,
});

export const insertAdRewardSchema = createInsertSchema(adRewards).omit({
  id: true,
  viewDate: true,
});

// Enhanced share analytics tracking with event types
export const shareAnalytics = pgTable("share_analytics", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  userId: integer("user_id"), // Can be null for anonymous views
  shareMethod: text("share_method").notNull(), // email, twitter, facebook, linkedin, whatsapp, telegram, sms, link, pdf, image
  eventType: text("event_type").notNull().default("share"), // share, view
  share_timestamp: timestamp("share_timestamp").defaultNow(),
  last_viewed_at: timestamp("last_viewed_at"),
  view_count: integer("view_count").default(0),
  referrer: text("referrer"),
  user_agent: text("user_agent"),
  ip_address: text("ip_address"),
  recipient_email: text("recipient_email"),
  // Additional metadata as JSON - can include recipient info, client info, etc.
  metadata: jsonb("metadata").default({}),
});

// UTM parameter tracking for marketing campaign analysis
export const utmTracking = pgTable("utm_tracking", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  utmSource: text("utm_source"), // Identifies which site sent the traffic
  utmMedium: text("utm_medium"), // Identifies marketing medium (cpc, social, email)
  utmCampaign: text("utm_campaign"), // Identifies specific campaign
  utmContent: text("utm_content"), // Identifies what specifically was clicked
  utmTerm: text("utm_term"), // Identifies search terms
  timestamp: timestamp("timestamp").defaultNow(),
});

// Share metrics summary for faster queries
export const shareMetrics = pgTable("share_metrics", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  userId: integer("user_id").notNull(),
  totalShares: integer("total_shares").default(0),
  totalViews: integer("total_views").default(0),
  // Share method counts as JSON
  shareMethodCounts: jsonb("share_method_counts").default({}),
  // Date tracking
  firstShareDate: timestamp("first_share_date"),
  lastShareDate: timestamp("last_share_date"),
  firstViewDate: timestamp("first_view_date"),
  lastViewDate: timestamp("last_view_date"),
  // Daily metrics in JSON format
  dailyViewCounts: jsonb("daily_view_counts").default({}),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShareAnalyticsSchema = createInsertSchema(shareAnalytics).omit({
  id: true,
  share_timestamp: true,
  last_viewed_at: true,
  view_count: true,
});

export const insertUtmTrackingSchema = createInsertSchema(utmTracking).omit({
  id: true,
  timestamp: true,
});

export type ShareAnalytics = typeof shareAnalytics.$inferSelect;
export type InsertShareAnalytics = z.infer<typeof insertShareAnalyticsSchema>;
export type UtmTracking = typeof utmTracking.$inferSelect;
export type InsertUtmTracking = z.infer<typeof insertUtmTrackingSchema>;

// Subscription related types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type SubscriptionTransaction = typeof subscriptionTransactions.$inferSelect;
export type InsertSubscriptionTransaction = z.infer<typeof insertSubscriptionTransactionSchema>;

export type AdReward = typeof adRewards.$inferSelect;
export type InsertAdReward = z.infer<typeof insertAdRewardSchema>;

// Ad view interface for tracking ad views
export interface AdView {
  id: string;
  userId: number | null;
  adType: string;
  sourceAction: string;
  viewedAt: Date;
  completed: boolean;
  completedAt?: Date;
  duration?: number;
}

// Extended types for front-end use
export const invoiceWithItemsSchema = insertInvoiceSchema.extend({
  items: z.array(insertLineItemSchema.omit({ invoiceId: true })),
  // Allow scheduling an invoice when creating it
  scheduledSendDate: z.string().optional(),
});

export const recurringTemplateWithItemsSchema = insertRecurringTemplateSchema.extend({
  items: z.array(insertTemplateLineItemSchema.omit({ templateId: true })),
});

// Progress billing schemas
export const insertProgressContractSchema = createInsertSchema(progressContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  invoicedValue: true,
  paidValue: true,
  isCompleted: true,
});

export const insertProgressMilestoneSchema = createInsertSchema(progressMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  completedAt: true,
  invoicedAt: true,
  paidAt: true,
  invoiceId: true,
  status: true,
});

// Progress billing types
export type ProgressContract = typeof progressContracts.$inferSelect;
export type InsertProgressContract = z.infer<typeof insertProgressContractSchema>;

export type ProgressMilestone = typeof progressMilestones.$inferSelect;
export type InsertProgressMilestone = z.infer<typeof insertProgressMilestoneSchema>;

// Contract with milestones for frontend use
export const progressContractWithMilestonesSchema = insertProgressContractSchema.extend({
  milestones: z.array(insertProgressMilestoneSchema.omit({ contractId: true })),
});

export type ProgressContractWithMilestones = z.infer<typeof progressContractWithMilestonesSchema>;

export type InvoiceWithItems = z.infer<typeof invoiceWithItemsSchema>;
export type RecurringTemplateWithItems = z.infer<typeof recurringTemplateWithItemsSchema>;
