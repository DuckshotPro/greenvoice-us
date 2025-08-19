import { Router } from "express";
import { logError, logInfo } from "../utils/error-logger";
import { isAuthenticated } from "../replitAuth";
import { z } from "zod";
import { db } from "../db";
import { supportChatConversations, supportChatMessages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Start a new support conversation
const startConversationSchema = z.object({
  clientEmail: z.string().email(),
  clientName: z.string().optional(),
  subject: z.string(),
  initialMessage: z.string(),
  relatedInvoiceId: z.number().optional(),
  language: z.string().default('en'),
  clientTimezone: z.string().optional()
});

router.post("/conversations", async (req, res) => {
  try {
    const data = startConversationSchema.parse(req.body);
    
    // Create conversation
    const [conversation] = await db
      .insert(supportChatConversations)
      .values({
        clientEmail: data.clientEmail,
        clientName: data.clientName,
        subject: data.subject,
        relatedInvoiceId: data.relatedInvoiceId,
        language: data.language,
        clientTimezone: data.clientTimezone,
      })
      .returning();

    // Add initial message
    await db.insert(supportChatMessages).values({
      conversationId: conversation.id,
      senderType: 'client',
      senderName: data.clientName || data.clientEmail,
      messageContent: data.initialMessage,
      readByClient: true,
      readByAgent: false
    });

    logInfo(`New support conversation started: ${conversation.id}`, 'SupportChat');

    res.status(201).json({
      conversation,
      message: "Support conversation started successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request parameters", details: error.errors });
    }
    
    logError(`Failed to start support conversation: ${error}`, 'SupportChat');
    res.status(500).json({ error: "Failed to start support conversation" });
  }
});

// Send a message in a conversation
const sendMessageSchema = z.object({
  conversationId: z.number(),
  messageContent: z.string(),
  senderName: z.string(),
  senderType: z.enum(['client', 'agent', 'ai_assistant']),
  messageType: z.enum(['text', 'file', 'image', 'invoice_share', 'system']).default('text'),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number()
  })).default([]),
  aiGenerated: z.boolean().default(false)
});

router.post("/messages", async (req, res) => {
  try {
    const data = sendMessageSchema.parse(req.body);
    
    // Insert message
    const [message] = await db
      .insert(supportChatMessages)
      .values({
        conversationId: data.conversationId,
        senderType: data.senderType,
        senderName: data.senderName,
        messageContent: data.messageContent,
        messageType: data.messageType,
        attachments: data.attachments,
        aiGenerated: data.aiGenerated,
        readByClient: data.senderType === 'client',
        readByAgent: data.senderType === 'agent'
      })
      .returning();

    // Update conversation last message timestamp
    await db
      .update(supportChatConversations)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(supportChatConversations.id, data.conversationId));

    logInfo(`New message sent in conversation ${data.conversationId}`, 'SupportChat');

    res.status(201).json({
      message,
      success: true
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request parameters", details: error.errors });
    }
    
    logError(`Failed to send support message: ${error}`, 'SupportChat');
    res.status(500).json({ error: "Failed to send support message" });
  }
});

// Get conversation details with messages
router.get("/conversations/:id", async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }

    // Get conversation
    const [conversation] = await db
      .select()
      .from(supportChatConversations)
      .where(eq(supportChatConversations.id, conversationId));

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Get messages
    const messages = await db
      .select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.conversationId, conversationId))
      .orderBy(supportChatMessages.timestamp);

    res.json({
      conversation,
      messages,
      messageCount: messages.length
    });
  } catch (error) {
    logError(`Failed to get conversation details: ${error}`, 'SupportChat');
    res.status(500).json({ error: "Failed to get conversation details" });
  }
});

// Get all conversations (for admin/agent view)
router.get("/conversations", isAuthenticated, async (req, res) => {
  try {
    const { status = 'open', limit = 50, offset = 0 } = req.query;
    
    const conversations = await db
      .select()
      .from(supportChatConversations)
      .where(status !== 'all' ? eq(supportChatConversations.status, status as string) : undefined)
      .orderBy(desc(supportChatConversations.lastMessageAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({
      conversations,
      count: conversations.length
    });
  } catch (error) {
    logError(`Failed to get conversations list: ${error}`, 'SupportChat');
    res.status(500).json({ error: "Failed to get conversations list" });
  }
});

// Update conversation status
const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  assignedToUserId: z.number().optional()
});

router.patch("/conversations/:id/status", isAuthenticated, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const data = updateStatusSchema.parse(req.body);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }

    const updates: any = {
      status: data.status,
      updatedAt: new Date()
    };

    if (data.status === 'resolved') {
      updates.resolvedAt = new Date();
    }

    if (data.assignedToUserId) {
      updates.assignedToUserId = data.assignedToUserId;
    }

    await db
      .update(supportChatConversations)
      .set(updates)
      .where(eq(supportChatConversations.id, conversationId));

    logInfo(`Conversation ${conversationId} status updated to ${data.status}`, 'SupportChat');

    res.json({
      success: true,
      message: "Conversation status updated"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request parameters", details: error.errors });
    }
    
    logError(`Failed to update conversation status: ${error}`, 'SupportChat');
    res.status(500).json({ error: "Failed to update conversation status" });
  }
});

// Mark messages as read
router.patch("/conversations/:id/read", async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const { readerType } = req.body; // 'client' or 'agent'
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }

    const updateField = readerType === 'client' ? 'readByClient' : 'readByAgent';
    
    await db
      .update(supportChatMessages)
      .set({ [updateField]: true })
      .where(eq(supportChatMessages.conversationId, conversationId));

    res.json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (error) {
    logError(`Failed to mark messages as read: ${error}`, 'SupportChat');
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

export { router as chatRouter };