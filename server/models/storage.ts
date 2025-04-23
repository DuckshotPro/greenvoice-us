import { 
  users, type User, type InsertUser,
  invoices, type Invoice, type InsertInvoice,
  lineItems, type LineItem, type InsertLineItem,
  recurringTemplates, type RecurringTemplate, type InsertRecurringTemplate,
  templateLineItems, type TemplateLineItem, type InsertTemplateLineItem,
  scheduledInvoices, type ScheduledInvoice, type InsertScheduledInvoice,
  adRewards, type AdReward, type InsertAdReward,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  subscriptionTransactions, type SubscriptionTransaction, type InsertSubscriptionTransaction,
  shareAnalytics, type ShareAnalytics, type InsertShareAnalytics,
  type InvoiceWithItems, type RecurringTemplateWithItems,
  payments, type Payment, type InsertPayment // Added payment table and types
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db, pool } from "../models/db";
import { eq, and, gte, lt, desc, asc } from "drizzle-orm";
import { AttachmentMetadata } from './attachment-storage';
import { v4 as uuidv4 } from 'uuid';

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserSubscription(id: number, plan: string, expiryDate: Date): Promise<User | undefined>;
  updateUserPremiumDays(id: number, daysToAdd: number): Promise<User | undefined>;
  recordAdView(userId: number, daysAwarded: number): Promise<User | undefined>;

  // Invoice methods
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  createInvoiceWithItems(invoiceWithItems: InvoiceWithItems): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  getAllInvoices(userId?: number): Promise<Invoice[]>;
  getInvoicesByStatus(status: string, userId?: number): Promise<Invoice[]>;
  scheduleInvoice(invoiceId: number, scheduleDate: Date): Promise<ScheduledInvoice>;
  updateInvoiceStatus(invoiceId: number, status: string): Promise<Invoice | undefined>;

  // Line item methods
  getLineItems(invoiceId: number): Promise<LineItem[]>;
  createLineItem(lineItem: InsertLineItem): Promise<LineItem>;
  updateLineItem(id: number, lineItem: Partial<InsertLineItem>): Promise<LineItem | undefined>;
  deleteLineItem(id: number): Promise<boolean>;
  deleteLineItemsByInvoiceId(invoiceId: number): Promise<boolean>;

  // Recurring Invoice Template methods
  getRecurringTemplate(id: number): Promise<RecurringTemplate | undefined>;
  getAllRecurringTemplates(userId: number): Promise<RecurringTemplate[]>;
  createRecurringTemplate(template: InsertRecurringTemplate): Promise<RecurringTemplate>;
  createRecurringTemplateWithItems(templateWithItems: RecurringTemplateWithItems): Promise<RecurringTemplate>;
  updateRecurringTemplate(id: number, template: Partial<InsertRecurringTemplate>): Promise<RecurringTemplate | undefined>;
  deleteRecurringTemplate(id: number): Promise<boolean>;
  toggleRecurringTemplate(id: number, isActive: boolean): Promise<RecurringTemplate | undefined>;

  // Template Line Item methods
  getTemplateLineItems(templateId: number): Promise<TemplateLineItem[]>;
  createTemplateLineItem(lineItem: InsertTemplateLineItem): Promise<TemplateLineItem>;
  updateTemplateLineItem(id: number, lineItem: Partial<InsertTemplateLineItem>): Promise<TemplateLineItem | undefined>;
  deleteTemplateLineItem(id: number): Promise<boolean>;
  deleteTemplateLineItemsByTemplateId(templateId: number): Promise<boolean>;

  // Processing methods for scheduled and recurring invoices
  getScheduledInvoicesToProcess(): Promise<ScheduledInvoice[]>;
  updateScheduledInvoiceStatus(id: number, status: string, errorMessage?: string): Promise<ScheduledInvoice | undefined>;
  getRecurringTemplatesToProcess(): Promise<RecurringTemplate[]>;
  updateRecurringTemplateNextDate(id: number, nextDate: Date): Promise<RecurringTemplate | undefined>;
  generateInvoiceFromTemplate(templateId: number): Promise<Invoice | undefined>;

  // Share analytics methods
  trackShareAnalytics(shareData: InsertShareAnalytics): Promise<ShareAnalytics>;
  recordShareView(invoiceId: number, shareMethod: string, referrer?: string, userAgent?: string, ipAddress?: string, metadata?: Record<string, any>): Promise<ShareAnalytics | undefined>;
  getShareAnalytics(invoiceId: number): Promise<ShareAnalytics[]>;
  getShareAnalyticsByMethod(userId: number, options?: { startDate?: Date, endDate?: Date, groupBy?: string }): Promise<{ method: string, count: number }[]>;
  getShareViewAnalytics(userId: number, options?: { startDate?: Date, endDate?: Date, groupBy?: string }): Promise<{ invoiceId: number, views: number, date?: Date }[]>;

  // Attachment methods
  storeAttachmentMetadata(metadata: AttachmentMetadata): Promise<void>;
  getAttachmentMetadata(id: string): Promise<AttachmentMetadata | null>;
  getInvoiceAttachmentMetadata(invoiceId: number): Promise<AttachmentMetadata[]>;
  deleteAttachmentMetadata(id: string): Promise<boolean>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]>;

}


export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async updateUserSubscription(id: number, plan: string, expiryDate: Date): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ 
        subscriptionPlan: plan as any,
        subscriptionExpiry: expiryDate
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async updateUserPremiumDays(id: number, daysToAdd: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const currentDays = user.premiumDaysRemaining || 0;
    const newDaysTotal = currentDays + daysToAdd;

    const [updatedUser] = await db.update(users)
      .set({ premiumDaysRemaining: newDaysTotal })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async recordAdView(userId: number, daysAwarded: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const now = new Date();

    await db.insert(adRewards).values({
      userId,
      rewardType: 'premium_day',
      daysAwarded,
      expiryDate: new Date(Date.now() + daysAwarded * 86400000), //More robust expiry calculation
      adProvider: 'internal',
    });

    const [updatedUser] = await db.update(users)
      .set({ 
        lastAdViewTime: now,
        lastAdDaysAwarded: daysAwarded,
        premiumDaysRemaining: (user.premiumDaysRemaining || 0) + daysAwarded
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const shareableLink = nanoid(10);
    const [invoice] = await db.insert(invoices).values({
      ...insertInvoice,
      shareableLink,
      currency: insertInvoice.currency || "USD"
    }).returning();

    return invoice;
  }

  async createInvoiceWithItems(invoiceWithItems: InvoiceWithItems): Promise<Invoice> {
    const { items, scheduledSendDate, ...invoiceData } = invoiceWithItems;
    const invoice = await this.createInvoice(invoiceData as InsertInvoice);

    if (items && items.length > 0) {
      for (const item of items) {
        await this.createLineItem({
          ...item,
          invoiceId: invoice.id
        });
      }
    }

    if (scheduledSendDate) {
      const scheduleDate = new Date(scheduledSendDate);
      await this.scheduleInvoice(invoice.id, scheduleDate);
      await this.updateInvoiceStatus(invoice.id, 'scheduled');
    }

    return invoice;
  }

  async updateInvoice(id: number, invoiceUpdate: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db.update(invoices)
      .set(invoiceUpdate)
      .where(eq(invoices.id, id))
      .returning();

    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    await this.deleteLineItemsByInvoiceId(id);
    await db.delete(scheduledInvoices).where(eq(scheduledInvoices.invoiceId, id));
    const [deletedInvoice] = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    return !!deletedInvoice;
  }

  async getAllInvoices(userId?: number): Promise<Invoice[]> {
    if (userId !== undefined) {
      return db.select().from(invoices)
        .where(eq(invoices.userId, userId))
        .orderBy(desc(invoices.createdAt));
    }

    return db.select().from(invoices)
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByStatus(status: string, userId?: number): Promise<Invoice[]> {
    if (userId !== undefined) {
      return db.select().from(invoices)
        .where(and(
          eq(invoices.status as any, status),
          eq(invoices.userId, userId)
        ))
        .orderBy(desc(invoices.createdAt));
    }

    return db.select().from(invoices)
      .where(eq(invoices.status as any, status))
      .orderBy(desc(invoices.createdAt));
  }

  async scheduleInvoice(invoiceId: number, scheduleDate: Date): Promise<ScheduledInvoice> {
    const [scheduledInvoice] = await db.insert(scheduledInvoices).values({
      invoiceId,
      sendDate: scheduleDate,
    }).returning();

    await db.update(invoices)
      .set({ scheduledSendDate: scheduleDate })
      .where(eq(invoices.id, invoiceId));

    return scheduledInvoice;
  }

  async updateInvoiceStatus(invoiceId: number, status: string): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db.update(invoices)
      .set({ status: status as any })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return updatedInvoice;
  }

  // Line item methods
  async getLineItems(invoiceId: number): Promise<LineItem[]> {
    return db.select().from(lineItems).where(eq(lineItems.invoiceId, invoiceId));
  }

  async createLineItem(insertLineItem: InsertLineItem): Promise<LineItem> {
    const [lineItem] = await db.insert(lineItems).values(insertLineItem).returning();
    return lineItem;
  }

  async updateLineItem(id: number, lineItemUpdate: Partial<InsertLineItem>): Promise<LineItem | undefined> {
    const [updatedLineItem] = await db.update(lineItems)
      .set(lineItemUpdate)
      .where(eq(lineItems.id, id))
      .returning();

    return updatedLineItem;
  }

  async deleteLineItem(id: number): Promise<boolean> {
    const [deletedLineItem] = await db.delete(lineItems)
      .where(eq(lineItems.id, id))
      .returning();

    return !!deletedLineItem;
  }

  async deleteLineItemsByInvoiceId(invoiceId: number): Promise<boolean> {
    await db.delete(lineItems)
      .where(eq(lineItems.invoiceId, invoiceId));

    return true;
  }

  // Recurring Invoice Template methods
  async getRecurringTemplate(id: number): Promise<RecurringTemplate | undefined> {
    const [template] = await db.select().from(recurringTemplates).where(eq(recurringTemplates.id, id));
    return template;
  }

  async getAllRecurringTemplates(userId: number): Promise<RecurringTemplate[]> {
    return db.select().from(recurringTemplates)
      .where(eq(recurringTemplates.userId, userId))
      .orderBy(desc(recurringTemplates.createdAt));
  }

  async createRecurringTemplate(template: InsertRecurringTemplate): Promise<RecurringTemplate> {
    const [createdTemplate] = await db.insert(recurringTemplates).values(template).returning();
    return createdTemplate;
  }

  async createRecurringTemplateWithItems(templateWithItems: RecurringTemplateWithItems): Promise<RecurringTemplate> {
    const { items, ...templateData } = templateWithItems;
    const template = await this.createRecurringTemplate(templateData);

    if (items && items.length > 0) {
      for (const item of items) {
        await this.createTemplateLineItem({
          ...item,
          templateId: template.id
        });
      }
    }

    return template;
  }

  async updateRecurringTemplate(id: number, templateUpdate: Partial<InsertRecurringTemplate>): Promise<RecurringTemplate | undefined> {
    const [updatedTemplate] = await db.update(recurringTemplates)
      .set(templateUpdate)
      .where(eq(recurringTemplates.id, id))
      .returning();

    return updatedTemplate;
  }

  async deleteRecurringTemplate(id: number): Promise<boolean> {
    await this.deleteTemplateLineItemsByTemplateId(id);
    const [deletedTemplate] = await db.delete(recurringTemplates)
      .where(eq(recurringTemplates.id, id))
      .returning();

    return !!deletedTemplate;
  }

  async toggleRecurringTemplate(id: number, isActive: boolean): Promise<RecurringTemplate | undefined> {
    const [updatedTemplate] = await db.update(recurringTemplates)
      .set({ isActive })
      .where(eq(recurringTemplates.id, id))
      .returning();

    return updatedTemplate;
  }

  // Template Line Item methods
  async getTemplateLineItems(templateId: number): Promise<TemplateLineItem[]> {
    return db.select().from(templateLineItems).where(eq(templateLineItems.templateId, templateId));
  }

  async createTemplateLineItem(lineItem: InsertTemplateLineItem): Promise<TemplateLineItem> {
    const [createdItem] = await db.insert(templateLineItems).values(lineItem).returning();
    return createdItem;
  }

  async updateTemplateLineItem(id: number, lineItemUpdate: Partial<InsertTemplateLineItem>): Promise<TemplateLineItem | undefined> {
    const [updatedItem] = await db.update(templateLineItems)
      .set(lineItemUpdate)
      .where(eq(templateLineItems.id, id))
      .returning();

    return updatedItem;
  }

  async deleteTemplateLineItem(id: number): Promise<boolean> {
    const [deletedItem] = await db.delete(templateLineItems)
      .where(eq(templateLineItems.id, id))
      .returning();

    return !!deletedItem;
  }

  async deleteTemplateLineItemsByTemplateId(templateId: number): Promise<boolean> {
    await db.delete(templateLineItems)
      .where(eq(templateLineItems.templateId, templateId));

    return true;
  }

  // Processing methods for scheduled and recurring invoices
  async getScheduledInvoicesToProcess(): Promise<ScheduledInvoice[]> {
    const now = new Date();
    return db.select().from(scheduledInvoices)
      .where(and(
        eq(scheduledInvoices.status, 'pending'),
        lt(scheduledInvoices.sendDate, now)
      ))
      .orderBy(asc(scheduledInvoices.sendDate));
  }

  async updateScheduledInvoiceStatus(id: number, status: string, errorMessage?: string): Promise<ScheduledInvoice | undefined> {
    if (errorMessage) {
      const [currentSchedule] = await db.select().from(scheduledInvoices).where(eq(scheduledInvoices.id, id));
      if (!currentSchedule) return undefined;
      const retryCount = (currentSchedule.retryCount || 0) + 1;
      const [updatedSchedule] = await db.update(scheduledInvoices)
        .set({ 
          status,
          errorMessage,
          retryCount,
          processedAt: status === 'sent' ? new Date() : undefined
        })
        .where(eq(scheduledInvoices.id, id))
        .returning();
      return updatedSchedule;
    }
    const [updatedSchedule] = await db.update(scheduledInvoices)
      .set({ 
        status,
        processedAt: status === 'sent' ? new Date() : undefined
      })
      .where(eq(scheduledInvoices.id, id))
      .returning();
    return updatedSchedule;
  }

  async getRecurringTemplatesToProcess(): Promise<RecurringTemplate[]> {
    const now = new Date();
    return db.select().from(recurringTemplates)
      .where(and(
        eq(recurringTemplates.isActive, true),
        lt(recurringTemplates.nextInvoiceDate, now)
      ))
      .orderBy(asc(recurringTemplates.nextInvoiceDate));
  }

  async updateRecurringTemplateNextDate(id: number, nextDate: Date): Promise<RecurringTemplate | undefined> {
    const [updatedTemplate] = await db.update(recurringTemplates)
      .set({ 
        nextInvoiceDate: nextDate,
        lastGeneratedAt: new Date()
      })
      .where(eq(recurringTemplates.id, id))
      .returning();

    return updatedTemplate;
  }

  async generateInvoiceFromTemplate(templateId: number): Promise<Invoice | undefined> {
    const template = await this.getRecurringTemplate(templateId);
    if (!template) return undefined;

    const templateItems = await this.getTemplateLineItems(templateId);

    const subtotal = templateItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (template.taxRate / 100);
    const total = subtotal + taxAmount;

    const date = new Date();
    const invoiceNumber = `${template.invoicePrefix}-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const [invoice] = await db.insert(invoices).values({
      userId: template.userId,
      invoiceNumber,
      issueDate: date.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      currency: template.currency,
      senderName: template.senderName,
      senderEmail: template.senderEmail,
      senderAddress: template.senderAddress,
      senderPhone: template.senderPhone,
      clientName: template.clientName,
      clientEmail: template.clientEmail,
      clientAddress: template.clientAddress,
      subtotal,
      taxRate: template.taxRate,
      taxAmount,
      total,
      notes: template.notes,
      status: 'draft',
      recurringTemplateId: template.id,
      shareableLink: nanoid(10)
    }).returning();

    for (const templateItem of templateItems) {
      await db.insert(lineItems).values({
        invoiceId: invoice.id,
        description: templateItem.description,
        quantity: templateItem.quantity,
        rate: templateItem.rate,
        amount: templateItem.amount
      });
    }

    return invoice;
  }

  // Share analytics methods
  async trackShareAnalytics(shareData: InsertShareAnalytics): Promise<ShareAnalytics> {
    const [analytics] = await db.insert(shareAnalytics).values(shareData).returning();
    return analytics;
  }

  async recordShareView(
    invoiceId: number,
    shareMethod: string,
    referrer?: string,
    userAgent?: string,
    ipAddress?: string,
    metadata?: Record<string, any>
  ): Promise<ShareAnalytics | undefined> {
    const [existingShare] = await db.select()
      .from(shareAnalytics)
      .where(and(
        eq(shareAnalytics.invoiceId, invoiceId),
        eq(shareAnalytics.shareMethod, shareMethod)
      ))
      .orderBy(desc(shareAnalytics.shareTimestamp))
      .limit(1);

    if (!existingShare) return undefined;

    const [updatedShare] = await db.update(shareAnalytics)
      .set({ 
        viewCount: (existingShare.viewCount || 0) + 1,
        lastViewedAt: new Date(),
        referrer: referrer || existingShare.referrer,
        userAgent: userAgent || existingShare.userAgent,
        ipAddress: ipAddress || existingShare.ipAddress,
        metadata: metadata || existingShare.metadata
      })
      .where(eq(shareAnalytics.id, existingShare.id))
      .returning();

    return updatedShare;
  }

  async getShareAnalytics(invoiceId: number): Promise<ShareAnalytics[]> {
    return db.select()
      .from(shareAnalytics)
      .where(eq(shareAnalytics.invoiceId, invoiceId))
      .orderBy(desc(shareAnalytics.shareTimestamp));
  }

  async getShareAnalyticsByMethod(userId: number, options?: { startDate?: Date, endDate?: Date, groupBy?: string }): Promise<{ method: string, count: number }[]> {
    const userInvoices = await this.getAllInvoices(userId);
    const invoiceIds = userInvoices.map(invoice => invoice.id);

    if (invoiceIds.length === 0) {
      return [];
    }

    let whereClause = `"invoice_id" IN (${invoiceIds.join(',')})`;
    const params: any[] = [];

    if (options?.startDate) {
      whereClause += ` AND "created_at" >= $${params.length + 1}`;
      params.push(options.startDate);
    }

    if (options?.endDate) {
      whereClause += ` AND "created_at" <= $${params.length + 1}`;
      params.push(options.endDate);
    }

    let groupByClause = `"share_method"`;
    if (options?.groupBy && options.groupBy !== 'method' && options.groupBy !== 'none') {
      if (options.groupBy === 'day') {
        groupByClause = `DATE_TRUNC('day', "created_at"), "share_method"`;
      } else if (options.groupBy === 'week') {
        groupByClause = `DATE_TRUNC('week', "created_at"), "share_method"`;
      } else if (options.groupBy === 'month') {
        groupByClause = `DATE_TRUNC('month', "created_at"), "share_method"`;
      }
    }

    let query = `
      SELECT "share_method" as method, COUNT(*) as count 
      FROM "share_analytics" 
      WHERE ${whereClause} 
      GROUP BY ${groupByClause} 
      ORDER BY count DESC
    `;

    const result = await pool.query(query, params);
    const rows = result as unknown as { rows: Array<{ method: string, count: string }> };

    return (rows.rows || []).map((row: any) => ({
      method: row.method,
      count: parseInt(row.count)
    }));
  }

  async getShareViewAnalytics(userId: number, options?: { startDate?: Date, endDate?: Date, groupBy?: string }): Promise<{ invoiceId: number, views: number, date?: Date }[]> {
    const userInvoices = await this.getAllInvoices(userId);
    const invoiceIds = userInvoices.map(invoice => invoice.id);

    if (invoiceIds.length === 0) {
      return [];
    }

    let whereClause = `"invoice_id" IN (${invoiceIds.join(',')})`;
    const params: any[] = [];

    if (options?.startDate) {
      whereClause += ` AND "created_at" >= $${params.length + 1}`;
      params.push(options.startDate);
    }

    if (options?.endDate) {
      whereClause += ` AND "created_at" <= $${params.length + 1}`;
      params.push(options.endDate);
    }

    let groupByClause = `"invoice_id"`;
    let selectClause = `"invoice_id" as "invoiceId", SUM("view_count") as views`;

    if (options?.groupBy && options.groupBy !== 'none') {
      if (options.groupBy === 'day') {
        groupByClause = `DATE_TRUNC('day', "created_at"), "invoice_id"`;
        selectClause = `"invoice_id" as "invoiceId", DATE_TRUNC('day', "created_at") as date, SUM("view_count") as views`;
      } else if (options.groupBy === 'week') {
        groupByClause = `DATE_TRUNC('week', "created_at"), "invoice_id"`;
        selectClause = `"invoice_id" as "invoiceId", DATE_TRUNC('week', "created_at") as date, SUM("view_count") as views`;
      } else if (options.groupBy === 'month') {
        groupByClause = `DATE_TRUNC('month', "created_at"), "invoice_id"`;
        selectClause = `"invoice_id" as "invoiceId", DATE_TRUNC('month', "created_at") as date, SUM("view_count") as views`;
      }
    }

    let query = `
      SELECT ${selectClause}
      FROM "share_analytics" 
      WHERE ${whereClause} 
      GROUP BY ${groupByClause} 
      ORDER BY views DESC
    `;

    const result = await pool.query(query, params);
    const rows = result as unknown as { rows: Array<{ invoiceId: string, views: string, date?: string }> };

    return (rows.rows || []).map((row: any) => ({
      invoiceId: parseInt(row.invoiceId),
      views: parseInt(row.views),
      ...(row.date && { date: new Date(row.date) })
    }));
  }

  // Attachment methods
  async storeAttachmentMetadata(metadata: AttachmentMetadata): Promise<void> {
    if (!global.attachments) {
      global.attachments = [];
    }
    global.attachments.push(metadata);
  }

  async getAttachmentMetadata(id: string): Promise<AttachmentMetadata | null> {
    if (!global.attachments) {
      return null;
    }
    const attachment = global.attachments.find((a: AttachmentMetadata) => a.id === id);
    return attachment || null;
  }

  async getInvoiceAttachmentMetadata(invoiceId: number): Promise<AttachmentMetadata[]> {
    if (!global.attachments) {
      return [];
    }
    return global.attachments.filter((a: AttachmentMetadata) => a.invoiceId === invoiceId);
  }

  async deleteAttachmentMetadata(id: string): Promise<boolean> {
    if (!global.attachments) {
      return false;
    }
    const initialLength = global.attachments.length;
    global.attachments = global.attachments.filter((a: AttachmentMetadata) => a.id !== id);
    return global.attachments.length < initialLength;
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [createdPayment] = await db.insert(payments).values(payment).returning();
    return createdPayment;
  }

  async getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  }
}

export const storage = new DatabaseStorage();