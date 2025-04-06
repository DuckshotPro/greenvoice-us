import { 
  users, type User, type InsertUser,
  invoices, type Invoice, type InsertInvoice,
  lineItems, type LineItem, type InsertLineItem,
  type InvoiceWithItems
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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

  // Line item methods
  getLineItems(invoiceId: number): Promise<LineItem[]>;
  createLineItem(lineItem: InsertLineItem): Promise<LineItem>;
  updateLineItem(id: number, lineItem: Partial<InsertLineItem>): Promise<LineItem | undefined>;
  deleteLineItem(id: number): Promise<boolean>;
  deleteLineItemsByInvoiceId(invoiceId: number): Promise<boolean>;
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
    const [updatedInvoice] = await db.update(invoices)
      .set(invoiceUpdate)
      .where(eq(invoices.id, id))
      .returning();
    
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    // Delete related line items first
    await this.deleteLineItemsByInvoiceId(id);
    
    // Then delete the invoice
    const [deletedInvoice] = await db.delete(invoices)
      .where(eq(invoices.id, id))
      .returning();
    
    return !!deletedInvoice;
  }

  async getAllInvoices(userId?: number): Promise<Invoice[]> {
    if (userId !== undefined) {
      return db.select().from(invoices).where(eq(invoices.userId, userId));
    }
    
    return db.select().from(invoices);
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
}

// Memory storage implementation for reference
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private invoices: Map<number, Invoice>;
  private lineItems: Map<number, LineItem>;
  private userCurrentId: number;
  private invoiceCurrentId: number;
  private lineItemCurrentId: number;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    this.lineItems = new Map();
    this.userCurrentId = 1;
    this.invoiceCurrentId = 1;
    this.lineItemCurrentId = 1;
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
    
    // Ensure required fields are present
    const invoice: Invoice = { 
      ...insertInvoice, 
      id, 
      shareableLink,
      createdAt: new Date(),
      // Ensure currency is always defined (fallback to USD if missing)
      currency: insertInvoice.currency || "USD"
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
    
    const updatedInvoice: Invoice = { 
      ...existingInvoice, 
      ...invoiceUpdate 
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
}

// Switch to DatabaseStorage
export const storage = new DatabaseStorage();
