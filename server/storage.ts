import { 
  users, type User, type InsertUser,
  invoices, type Invoice, type InsertInvoice,
  lineItems, type LineItem, type InsertLineItem,
  recurringTemplates, type RecurringTemplate, type InsertRecurringTemplate,
  templateLineItems, type TemplateLineItem, type InsertTemplateLineItem,
  scheduledInvoices, type ScheduledInvoice, type InsertScheduledInvoice,
  type InvoiceWithItems, type RecurringTemplateWithItems
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and, gte, lt, desc, asc } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Invoice methods
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  createInvoiceWithItems(invoiceWithItems: InvoiceWithItems): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  getAllInvoices(userId?: number): Promise<Invoice[]>;
  // Get invoices by status (draft, scheduled, sent, paid, void, overdue)
  getInvoicesByStatus(status: string, userId?: number): Promise<Invoice[]>;
  // Schedule an invoice to be sent at a future date 
  scheduleInvoice(invoiceId: number, scheduleDate: Date): Promise<ScheduledInvoice>;
  // Update the status of an invoice
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
  // Toggle the active state of a recurring template
  toggleRecurringTemplate(id: number, isActive: boolean): Promise<RecurringTemplate | undefined>;
  
  // Template Line Item methods
  getTemplateLineItems(templateId: number): Promise<TemplateLineItem[]>;
  createTemplateLineItem(lineItem: InsertTemplateLineItem): Promise<TemplateLineItem>;
  updateTemplateLineItem(id: number, lineItem: Partial<InsertTemplateLineItem>): Promise<TemplateLineItem | undefined>;
  deleteTemplateLineItem(id: number): Promise<boolean>;
  deleteTemplateLineItemsByTemplateId(templateId: number): Promise<boolean>;
  
  // Processing methods for scheduled and recurring invoices
  // Get scheduled invoices that are due to be sent
  getScheduledInvoicesToProcess(): Promise<ScheduledInvoice[]>;
  // Update a scheduled invoice's status after processing
  updateScheduledInvoiceStatus(id: number, status: string, errorMessage?: string): Promise<ScheduledInvoice | undefined>;
  // Get recurring templates that need to generate new invoices
  getRecurringTemplatesToProcess(): Promise<RecurringTemplate[]>;
  // Update the next invoice date for a recurring template
  updateRecurringTemplateNextDate(id: number, nextDate: Date): Promise<RecurringTemplate | undefined>;
  // Generate an invoice from a recurring template
  generateInvoiceFromTemplate(templateId: number): Promise<Invoice | undefined>;
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
      // Ensure currency is always defined (fallback to USD if missing)
      currency: insertInvoice.currency || "USD"
    }).returning();
    
    return invoice;
  }

  async createInvoiceWithItems(invoiceWithItems: InvoiceWithItems): Promise<Invoice> {
    // Extract items and scheduling date from the request
    const { items, scheduledSendDate, ...invoiceData } = invoiceWithItems;
    
    // Create the invoice first
    const invoice = await this.createInvoice(invoiceData as InsertInvoice);
    
    // Create all the line items
    if (items && items.length > 0) {
      for (const item of items) {
        await this.createLineItem({
          ...item,
          invoiceId: invoice.id
        });
      }
    }
    
    // If a scheduled date was provided, schedule the invoice
    if (scheduledSendDate) {
      const scheduleDate = new Date(scheduledSendDate);
      await this.scheduleInvoice(invoice.id, scheduleDate);
      
      // Update invoice status to scheduled
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
    // Delete related line items first
    await this.deleteLineItemsByInvoiceId(id);
    
    // Delete any scheduled entries
    await db.delete(scheduledInvoices)
      .where(eq(scheduledInvoices.invoiceId, id));
    
    // Then delete the invoice
    const [deletedInvoice] = await db.delete(invoices)
      .where(eq(invoices.id, id))
      .returning();
    
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
    // Create a scheduled invoice entry
    const [scheduledInvoice] = await db.insert(scheduledInvoices).values({
      invoiceId,
      sendDate: scheduleDate,
    }).returning();
    
    // Update the invoice with the scheduled date
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
    // Extract items from the request
    const { items, ...templateData } = templateWithItems;
    
    // Create the template first
    const template = await this.createRecurringTemplate(templateData);
    
    // Create all the template line items
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
    // Delete template line items first
    await this.deleteTemplateLineItemsByTemplateId(id);
    
    // Then delete the template
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
    
    // Get all pending scheduled invoices with send date <= now
    return db.select().from(scheduledInvoices)
      .where(and(
        eq(scheduledInvoices.status, 'pending'),
        lt(scheduledInvoices.sendDate, now)
      ))
      .orderBy(asc(scheduledInvoices.sendDate));
  }
  
  async updateScheduledInvoiceStatus(id: number, status: string, errorMessage?: string): Promise<ScheduledInvoice | undefined> {
    // When there's an error, first get the current record to increment retry count
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
    
    // No error, just update status
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
    
    // Get all active recurring templates with nextInvoiceDate <= now
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
    // Get the template
    const template = await this.getRecurringTemplate(templateId);
    if (!template) return undefined;
    
    // Get template line items
    const templateItems = await this.getTemplateLineItems(templateId);
    
    // Calculate financial details
    const subtotal = templateItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (template.taxRate / 100);
    const total = subtotal + taxAmount;
    
    // Generate the invoice number using prefix + date/sequence
    const date = new Date();
    const invoiceNumber = `${template.invoicePrefix}-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    
    // Set due date (30 days from today by default)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Create the invoice
    const [invoice] = await db.insert(invoices).values({
      userId: template.userId,
      invoiceNumber,
      issueDate: date.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      currency: template.currency,
      
      // Copy sender details from template
      senderName: template.senderName,
      senderEmail: template.senderEmail,
      senderAddress: template.senderAddress,
      senderPhone: template.senderPhone,
      
      // Copy client details from template
      clientName: template.clientName,
      clientEmail: template.clientEmail,
      clientAddress: template.clientAddress,
      
      // Financial details
      subtotal,
      taxRate: template.taxRate,
      taxAmount,
      total,
      
      // Additional info
      notes: template.notes,
      status: 'draft',
      recurringTemplateId: template.id,
      shareableLink: nanoid(10)
    }).returning();
    
    // Create line items
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
}

// Memory storage implementation for reference
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private invoices: Map<number, Invoice>;
  private lineItems: Map<number, LineItem>;
  private recurringTemplates: Map<number, RecurringTemplate>;
  private templateLineItems: Map<number, TemplateLineItem>;
  private scheduledInvoices: Map<number, ScheduledInvoice>;
  private userCurrentId: number;
  private invoiceCurrentId: number;
  private lineItemCurrentId: number;
  private templateCurrentId: number;
  private templateLineItemCurrentId: number;
  private scheduledInvoiceCurrentId: number;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    this.lineItems = new Map();
    this.recurringTemplates = new Map();
    this.templateLineItems = new Map();
    this.scheduledInvoices = new Map();
    this.userCurrentId = 1;
    this.invoiceCurrentId = 1;
    this.lineItemCurrentId = 1;
    this.templateCurrentId = 1;
    this.templateLineItemCurrentId = 1;
    this.scheduledInvoiceCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    return Array.from(this.invoices.values()).find(
      (invoice) => invoice.invoiceNumber === invoiceNumber,
    );
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceCurrentId++;
    const shareableLink = `${nanoid(10)}`;
    
    // Create an explicitly typed Invoice object
    const invoice: Invoice = { 
      id, 
      userId: insertInvoice.userId,
      invoiceNumber: insertInvoice.invoiceNumber,
      issueDate: insertInvoice.issueDate,
      dueDate: insertInvoice.dueDate,
      currency: insertInvoice.currency || "USD",
      senderName: insertInvoice.senderName,
      senderEmail: insertInvoice.senderEmail,
      senderAddress: insertInvoice.senderAddress,
      senderPhone: insertInvoice.senderPhone,
      clientName: insertInvoice.clientName,
      clientEmail: insertInvoice.clientEmail,
      clientAddress: insertInvoice.clientAddress,
      subtotal: insertInvoice.subtotal ?? 0,
      taxRate: insertInvoice.taxRate ?? 0,
      taxAmount: insertInvoice.taxAmount ?? 0,
      total: insertInvoice.total ?? 0,
      notes: insertInvoice.notes ?? null,
      status: "draft", // Default status is draft
      createdAt: new Date(),
      shareableLink,
      
      // Optional fields with defaults
      scheduledSendDate: null,
      sentAt: null,
      paidAt: null,
      recurringTemplateId: null,
      paymentMethod: null
    };
    
    this.invoices.set(id, invoice);
    return invoice;
  }

  async createInvoiceWithItems(invoiceWithItems: InvoiceWithItems): Promise<Invoice> {
    // Extract items from the request
    const { items, ...invoiceData } = invoiceWithItems;
    
    // Create the invoice first
    const invoice = await this.createInvoice(invoiceData as InsertInvoice);
    
    // Create all the line items
    if (items && items.length > 0) {
      for (const item of items) {
        await this.createLineItem({
          ...item,
          invoiceId: invoice.id
        });
      }
    }
    
    return invoice;
  }

  async updateInvoice(id: number, invoiceUpdate: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    
    if (!existingInvoice) {
      return undefined;
    }
    
    // Ensure that all required fields have fallbacks
    const updatedInvoice: Invoice = { 
      ...existingInvoice, 
      ...invoiceUpdate,
      // Make sure these are always defined even after update
      taxRate: invoiceUpdate.taxRate ?? existingInvoice.taxRate ?? 0,
      taxAmount: invoiceUpdate.taxAmount ?? existingInvoice.taxAmount ?? 0,
      subtotal: invoiceUpdate.subtotal ?? existingInvoice.subtotal ?? 0,
      total: invoiceUpdate.total ?? existingInvoice.total ?? 0,
      notes: invoiceUpdate.notes ?? existingInvoice.notes ?? null
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const deleted = this.invoices.delete(id);
    if (deleted) {
      // Also delete related line items
      await this.deleteLineItemsByInvoiceId(id);
    }
    return deleted;
  }

  async getAllInvoices(userId?: number): Promise<Invoice[]> {
    const invoices = Array.from(this.invoices.values());
    
    if (userId !== undefined) {
      return invoices.filter(invoice => invoice.userId === userId);
    }
    
    return invoices;
  }

  // Line item methods
  async getLineItems(invoiceId: number): Promise<LineItem[]> {
    return Array.from(this.lineItems.values()).filter(
      (item) => item.invoiceId === invoiceId,
    );
  }

  async createLineItem(insertLineItem: InsertLineItem): Promise<LineItem> {
    const id = this.lineItemCurrentId++;
    const lineItem: LineItem = { ...insertLineItem, id };
    this.lineItems.set(id, lineItem);
    return lineItem;
  }

  async updateLineItem(id: number, lineItemUpdate: Partial<InsertLineItem>): Promise<LineItem | undefined> {
    const existingLineItem = this.lineItems.get(id);
    
    if (!existingLineItem) {
      return undefined;
    }
    
    const updatedLineItem: LineItem = { 
      ...existingLineItem, 
      ...lineItemUpdate 
    };
    
    this.lineItems.set(id, updatedLineItem);
    return updatedLineItem;
  }

  async deleteLineItem(id: number): Promise<boolean> {
    return this.lineItems.delete(id);
  }

  async deleteLineItemsByInvoiceId(invoiceId: number): Promise<boolean> {
    const lineItemsToDelete = Array.from(this.lineItems.values())
      .filter(item => item.invoiceId === invoiceId);
      
    for (const item of lineItemsToDelete) {
      this.lineItems.delete(item.id);
    }
    
    return true;
  }

  // New methods for scheduled invoices and recurring templates
  async getInvoicesByStatus(status: string, userId?: number): Promise<Invoice[]> {
    const invoices = Array.from(this.invoices.values());
    
    let filtered = invoices.filter(invoice => invoice.status === status);
    
    if (userId !== undefined) {
      filtered = filtered.filter(invoice => invoice.userId === userId);
    }
    
    return filtered;
  }
  
  async scheduleInvoice(invoiceId: number, scheduleDate: Date): Promise<ScheduledInvoice> {
    const id = this.scheduledInvoiceCurrentId++;
    
    const scheduledInvoice: ScheduledInvoice = {
      id,
      invoiceId,
      sendDate: scheduleDate,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
      errorMessage: null,
      processedAt: null
    };
    
    // Also update the invoice with the scheduled date
    const invoice = this.invoices.get(invoiceId);
    if (invoice) {
      this.invoices.set(invoiceId, {
        ...invoice,
        scheduledSendDate: scheduleDate,
        status: 'scheduled'
      });
    }
    
    this.scheduledInvoices.set(id, scheduledInvoice);
    return scheduledInvoice;
  }
  
  async updateInvoiceStatus(invoiceId: number, status: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(invoiceId);
    
    if (!invoice) {
      return undefined;
    }
    
    // Validate that status is one of the allowed enum values
    if (!['draft', 'scheduled', 'sent', 'paid', 'void', 'overdue'].includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    const updatedInvoice = {
      ...invoice,
      status: status as 'draft' | 'scheduled' | 'sent' | 'paid' | 'void' | 'overdue'
    };
    
    this.invoices.set(invoiceId, updatedInvoice);
    return updatedInvoice;
  }
  
  // Recurring Invoice Template methods
  async getRecurringTemplate(id: number): Promise<RecurringTemplate | undefined> {
    return this.recurringTemplates.get(id);
  }
  
  async getAllRecurringTemplates(userId: number): Promise<RecurringTemplate[]> {
    return Array.from(this.recurringTemplates.values())
      .filter(template => template.userId === userId);
  }
  
  async createRecurringTemplate(template: InsertRecurringTemplate): Promise<RecurringTemplate> {
    const id = this.templateCurrentId++;
    
    // Create a properly typed RecurringTemplate object with all required fields
    const recurringTemplate: RecurringTemplate = {
      id,
      name: template.name,
      userId: template.userId,
      currency: template.currency || "USD",
      senderName: template.senderName,
      senderEmail: template.senderEmail,
      senderAddress: template.senderAddress,
      senderPhone: template.senderPhone,
      clientName: template.clientName,
      clientEmail: template.clientEmail,
      clientAddress: template.clientAddress,
      frequency: template.frequency,
      nextInvoiceDate: template.nextInvoiceDate,
      invoicePrefix: template.invoicePrefix || "INV",
      taxRate: template.taxRate || 0,
      dayOfMonth: template.dayOfMonth || 1,
      dayOfWeek: template.dayOfWeek || 1,
      notes: template.notes || null,
      isActive: true,
      createdAt: new Date(),
      lastGeneratedAt: null,
      startDate: template.startDate || new Date(),
      endDate: template.endDate || null
    };
    
    this.recurringTemplates.set(id, recurringTemplate);
    return recurringTemplate;
  }
  
  async createRecurringTemplateWithItems(templateWithItems: RecurringTemplateWithItems): Promise<RecurringTemplate> {
    // Extract items from the request
    const { items, ...templateData } = templateWithItems;
    
    // Create the template first
    const template = await this.createRecurringTemplate(templateData);
    
    // Create all the template line items
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
    const template = this.recurringTemplates.get(id);
    
    if (!template) {
      return undefined;
    }
    
    const updatedTemplate = {
      ...template,
      ...templateUpdate
    };
    
    this.recurringTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteRecurringTemplate(id: number): Promise<boolean> {
    // Delete template line items first
    await this.deleteTemplateLineItemsByTemplateId(id);
    
    // Then delete the template
    return this.recurringTemplates.delete(id);
  }
  
  async toggleRecurringTemplate(id: number, isActive: boolean): Promise<RecurringTemplate | undefined> {
    const template = this.recurringTemplates.get(id);
    
    if (!template) {
      return undefined;
    }
    
    const updatedTemplate = {
      ...template,
      isActive
    };
    
    this.recurringTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  // Template Line Item methods
  async getTemplateLineItems(templateId: number): Promise<TemplateLineItem[]> {
    return Array.from(this.templateLineItems.values())
      .filter(item => item.templateId === templateId);
  }
  
  async createTemplateLineItem(lineItem: InsertTemplateLineItem): Promise<TemplateLineItem> {
    const id = this.templateLineItemCurrentId++;
    
    const templateLineItem: TemplateLineItem = {
      ...lineItem,
      id
    };
    
    this.templateLineItems.set(id, templateLineItem);
    return templateLineItem;
  }
  
  async updateTemplateLineItem(id: number, lineItemUpdate: Partial<InsertTemplateLineItem>): Promise<TemplateLineItem | undefined> {
    const lineItem = this.templateLineItems.get(id);
    
    if (!lineItem) {
      return undefined;
    }
    
    const updatedLineItem = {
      ...lineItem,
      ...lineItemUpdate
    };
    
    this.templateLineItems.set(id, updatedLineItem);
    return updatedLineItem;
  }
  
  async deleteTemplateLineItem(id: number): Promise<boolean> {
    return this.templateLineItems.delete(id);
  }
  
  async deleteTemplateLineItemsByTemplateId(templateId: number): Promise<boolean> {
    const itemsToDelete = Array.from(this.templateLineItems.values())
      .filter(item => item.templateId === templateId);
      
    for (const item of itemsToDelete) {
      this.templateLineItems.delete(item.id);
    }
    
    return true;
  }
  
  // Processing methods for scheduled and recurring invoices
  async getScheduledInvoicesToProcess(): Promise<ScheduledInvoice[]> {
    const now = new Date();
    
    return Array.from(this.scheduledInvoices.values())
      .filter(schedule => 
        schedule.status === 'pending' && schedule.sendDate <= now
      )
      .sort((a, b) => a.sendDate.getTime() - b.sendDate.getTime());
  }
  
  async updateScheduledInvoiceStatus(id: number, status: string, errorMessage?: string): Promise<ScheduledInvoice | undefined> {
    const schedule = this.scheduledInvoices.get(id);
    
    if (!schedule) {
      return undefined;
    }
    
    const updatedSchedule: ScheduledInvoice = {
      ...schedule,
      status,
      processedAt: status === 'sent' ? new Date() : schedule.processedAt
    };
    
    if (errorMessage) {
      updatedSchedule.errorMessage = errorMessage;
      updatedSchedule.retryCount = (updatedSchedule.retryCount || 0) + 1;
    }
    
    this.scheduledInvoices.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  async getRecurringTemplatesToProcess(): Promise<RecurringTemplate[]> {
    const now = new Date();
    
    return Array.from(this.recurringTemplates.values())
      .filter(template => 
        template.isActive && template.nextInvoiceDate <= now
      )
      .sort((a, b) => a.nextInvoiceDate.getTime() - b.nextInvoiceDate.getTime());
  }
  
  async updateRecurringTemplateNextDate(id: number, nextDate: Date): Promise<RecurringTemplate | undefined> {
    const template = this.recurringTemplates.get(id);
    
    if (!template) {
      return undefined;
    }
    
    const updatedTemplate: RecurringTemplate = {
      ...template,
      nextInvoiceDate: nextDate,
      lastGeneratedAt: new Date()
    };
    
    this.recurringTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async generateInvoiceFromTemplate(templateId: number): Promise<Invoice | undefined> {
    // Get the template
    const template = await this.getRecurringTemplate(templateId);
    if (!template) return undefined;
    
    // Get template line items
    const templateItems = await this.getTemplateLineItems(templateId);
    
    // Calculate financial details
    const subtotal = templateItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (template.taxRate / 100);
    const total = subtotal + taxAmount;
    
    // Generate the invoice number using prefix + date/sequence
    const date = new Date();
    const invoiceNumber = `${template.invoicePrefix}-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    
    // Set due date (30 days from today by default)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Create the invoice
    const id = this.invoiceCurrentId++;
    const invoice: Invoice = {
      id,
      userId: template.userId,
      invoiceNumber,
      issueDate: date.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      currency: template.currency,
      
      // Copy sender details from template
      senderName: template.senderName,
      senderEmail: template.senderEmail,
      senderAddress: template.senderAddress,
      senderPhone: template.senderPhone,
      
      // Copy client details from template
      clientName: template.clientName,
      clientEmail: template.clientEmail,
      clientAddress: template.clientAddress,
      
      // Financial details
      subtotal,
      taxRate: template.taxRate,
      taxAmount,
      total,
      
      // Additional info
      notes: template.notes || null,
      createdAt: new Date(),
      status: 'draft',
      recurringTemplateId: template.id,
      shareableLink: nanoid(10),
      scheduledSendDate: null,
      sentAt: null,
      paidAt: null,
      paymentMethod: null
    };
    
    this.invoices.set(id, invoice);
    
    // Create line items
    for (const templateItem of templateItems) {
      await this.createLineItem({
        invoiceId: invoice.id,
        description: templateItem.description,
        quantity: templateItem.quantity,
        rate: templateItem.rate,
        amount: templateItem.amount
      });
    }
    
    return invoice;
  }
}

// Switch to DatabaseStorage
export const storage = new DatabaseStorage();
