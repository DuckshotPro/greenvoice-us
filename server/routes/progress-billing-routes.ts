import { Router } from 'express';
import { z } from 'zod';
import { db } from '../models/db';
import { 
  progressContracts, 
  progressMilestones, 
  invoices, 
  progressContractWithMilestonesSchema,
  milestoneStatusEnum
} from '@shared/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { 
  idParamSchema, 
  paginationSchema
} from '../middleware/validation-schemas';
import { activityTrackers } from '../middleware/activity-tracker';
import { logError, logInfo } from '../utils/error-logger';

const router = Router();

/**
 * Create a new progress billing contract with milestones
 */
router.post(
  '/',
  requireAuth,
  validateBody(progressContractWithMilestonesSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const contractData = { ...req.body, userId };
      const { milestones, ...contractDetails } = contractData;
      
      // Set the remaining value to the total value initially
      contractDetails.remainingValue = contractDetails.totalValue;
      
      // Insert the contract
      const [newContract] = await db
        .insert(progressContracts)
        .values(contractDetails)
        .returning();
      
      // Insert all milestones with their contract ID
      if (milestones && milestones.length > 0) {
        const milestonesWithContractId = milestones.map((milestone, index) => ({
          ...milestone,
          contractId: newContract.id,
          orderIndex: index + 1, // Set the order index based on array position
        }));
        
        await db.insert(progressMilestones).values(milestonesWithContractId);
      }
      
      // Get the complete contract with milestones
      const contract = await getContractWithMilestones(newContract.id);
      
      res.status(201).json(contract);
    } catch (error: any) {
      logError('Error creating progress contract', 'ProgressBillingController', error);
      res.status(500).json({ message: 'Failed to create progress contract', error: error.message });
    }
  }
);

/**
 * Get all progress contracts for the authenticated user
 */
router.get(
  '/',
  requireAuth,
  validateQuery(paginationSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;
      const parsedPage = parseInt(page as string);
      const parsedLimit = parseInt(limit as string);
      const offset = (parsedPage - 1) * parsedLimit;
      
      const contracts = await db
        .select()
        .from(progressContracts)
        .where(eq(progressContracts.userId, userId))
        .orderBy(desc(progressContracts.createdAt))
        .limit(parsedLimit)
        .offset(offset);
      
      const totalCount = await db
        .select({ count: db.fn.count() })
        .from(progressContracts)
        .where(eq(progressContracts.userId, userId));
      
      res.json({
        data: contracts,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          totalCount: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / parsedLimit),
        },
      });
    } catch (error: any) {
      logError('Error fetching progress contracts', 'ProgressBillingController', error);
      res.status(500).json({ message: 'Failed to fetch progress contracts', error: error.message });
    }
  }
);

/**
 * Get a progress contract by ID with its milestones
 */
router.get(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const contractId = parseInt(req.params.id);
      
      const contract = await getContractWithMilestones(contractId, userId);
      
      if (!contract) {
        return res.status(404).json({ message: 'Progress contract not found' });
      }
      
      res.json(contract);
    } catch (error: any) {
      logError('Error fetching progress contract', 'ProgressBillingController', error);
      res.status(500).json({ message: 'Failed to fetch progress contract', error: error.message });
    }
  }
);

/**
 * Update a progress contract
 */
router.patch(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  validateBody(progressContractWithMilestonesSchema.partial()),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const contractId = parseInt(req.params.id);
      const { milestones, ...contractData } = req.body;
      
      // Check if contract exists and belongs to user
      const existingContract = await db
        .select()
        .from(progressContracts)
        .where(and(
          eq(progressContracts.id, contractId),
          eq(progressContracts.userId, userId)
        ))
        .limit(1);
      
      if (existingContract.length === 0) {
        return res.status(404).json({ message: 'Progress contract not found' });
      }
      
      // Update contract if data is provided
      if (Object.keys(contractData).length > 0) {
        await db
          .update(progressContracts)
          .set({
            ...contractData,
            updatedAt: new Date(),
          })
          .where(eq(progressContracts.id, contractId));
      }
      
      // Update milestones if provided
      if (milestones && milestones.length > 0) {
        // First get existing milestones to determine what to update, add, or remove
        const existingMilestones = await db
          .select()
          .from(progressMilestones)
          .where(eq(progressMilestones.contractId, contractId));
        
        const existingIds = new Set(existingMilestones.map(m => m.id));
        const updatedIds = new Set(milestones.filter(m => m.id).map(m => m.id));
        
        // Handle updates and new additions
        for (let i = 0; i < milestones.length; i++) {
          const milestone = milestones[i];
          
          if (milestone.id && existingIds.has(milestone.id)) {
            // Update existing milestone
            await db
              .update(progressMilestones)
              .set({
                ...milestone,
                contractId, // Ensure contract ID is correct
                orderIndex: i + 1, // Update order index
                updatedAt: new Date(),
              })
              .where(eq(progressMilestones.id, milestone.id));
          } else {
            // Insert new milestone
            await db
              .insert(progressMilestones)
              .values({
                ...milestone,
                contractId,
                orderIndex: i + 1,
              });
          }
        }
        
        // Remove milestones that are no longer in the list
        const toRemove = Array.from(existingIds).filter(id => !updatedIds.has(id));
        if (toRemove.length > 0) {
          for (const idToRemove of toRemove) {
            // Only delete if the milestone hasn't been invoiced yet
            await db
              .delete(progressMilestones)
              .where(and(
                eq(progressMilestones.id, idToRemove),
                isNull(progressMilestones.invoiceId)
              ));
          }
        }
      }
      
      // Get updated contract with milestones
      const updatedContract = await getContractWithMilestones(contractId);
      
      res.json(updatedContract);
    } catch (error: any) {
      logError('Error updating progress contract', 'ProgressBillingController', error);
      res.status(500).json({ message: 'Failed to update progress contract', error: error.message });
    }
  }
);

/**
 * Delete a progress contract if it has no invoiced milestones
 */
router.delete(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const contractId = parseInt(req.params.id);
      
      // Check if contract exists and belongs to user
      const existingContract = await db
        .select()
        .from(progressContracts)
        .where(and(
          eq(progressContracts.id, contractId),
          eq(progressContracts.userId, userId)
        ))
        .limit(1);
      
      if (existingContract.length === 0) {
        return res.status(404).json({ message: 'Progress contract not found' });
      }
      
      // Check if any milestones have been invoiced
      const invoicedMilestones = await db
        .select()
        .from(progressMilestones)
        .where(and(
          eq(progressMilestones.contractId, contractId),
          isNull(progressMilestones.invoiceId).not()
        ))
        .limit(1);
      
      if (invoicedMilestones.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete contract with invoiced milestones. Archive it instead.' 
        });
      }
      
      // Delete milestones first
      await db
        .delete(progressMilestones)
        .where(eq(progressMilestones.contractId, contractId));
      
      // Then delete the contract
      await db
        .delete(progressContracts)
        .where(eq(progressContracts.id, contractId));
      
      res.status(204).end();
    } catch (error: any) {
      logError('Error deleting progress contract', 'ProgressBillingController', error);
      res.status(500).json({ message: 'Failed to delete progress contract', error: error.message });
    }
  }
);

/**
 * Update milestone status
 */
router.patch(
  '/milestone/:id/status',
  requireAuth,
  validateParams(idParamSchema),
  validateBody(z.object({
    status: milestoneStatusEnum
  })),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const milestoneId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Get milestone with contract to verify ownership
      const [milestone] = await db
        .select({
          milestone: progressMilestones,
          contract: progressContracts,
        })
        .from(progressMilestones)
        .innerJoin(
          progressContracts,
          eq(progressMilestones.contractId, progressContracts.id)
        )
        .where(and(
          eq(progressMilestones.id, milestoneId),
          eq(progressContracts.userId, userId)
        ))
        .limit(1);
      
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }
      
      // Update the milestone status with appropriate timestamps
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };
      
      if (status === 'current' && !milestone.milestone.startedAt) {
        updateData.startedAt = new Date();
      } else if (status === 'completed' && !milestone.milestone.completedAt) {
        updateData.completedAt = new Date();
      }
      
      await db
        .update(progressMilestones)
        .set(updateData)
        .where(eq(progressMilestones.id, milestoneId));
      
      const [updatedMilestone] = await db
        .select()
        .from(progressMilestones)
        .where(eq(progressMilestones.id, milestoneId));
      
      res.json(updatedMilestone);
    } catch (error: any) {
      logError('Error updating milestone status', error);
      res.status(500).json({ message: 'Failed to update milestone status', error: error.message });
    }
  }
);

/**
 * Generate invoice for a milestone
 */
router.post(
  '/milestone/:id/invoice',
  requireAuth,
  validateParams(idParamSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const milestoneId = parseInt(req.params.id);
      
      // Get milestone with contract to prepare invoice data
      const [result] = await db
        .select({
          milestone: progressMilestones,
          contract: progressContracts,
        })
        .from(progressMilestones)
        .innerJoin(
          progressContracts,
          eq(progressMilestones.contractId, progressContracts.id)
        )
        .where(and(
          eq(progressMilestones.id, milestoneId),
          eq(progressContracts.userId, userId)
        ))
        .limit(1);
      
      if (!result) {
        return res.status(404).json({ message: 'Milestone not found' });
      }
      
      const { milestone, contract } = result;
      
      // Check if milestone is already invoiced
      if (milestone.invoiceId) {
        return res.status(400).json({ 
          message: 'Milestone already invoiced',
          invoiceId: milestone.invoiceId
        });
      }
      
      // Generate a unique invoice number
      const today = new Date();
      const invoiceNumber = `${contract.contractNumber}-M${milestone.orderIndex}-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      
      // Create the invoice
      const [newInvoice] = await db
        .insert(invoices)
        .values({
          userId,
          invoiceNumber,
          issueDate: today.toISOString().split('T')[0],
          dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Due in 14 days
          currency: contract.currency,
          
          // Sender details
          senderName: contract.name,
          senderEmail: req.user!.email,
          senderAddress: "Your Address", // This should come from user profile
          senderPhone: "Your Phone", // This should come from user profile
          
          // Client details
          clientName: contract.clientName,
          clientEmail: contract.clientEmail,
          clientAddress: contract.clientAddress,
          
          // Financial details
          subtotal: milestone.amount,
          taxRate: contract.taxRate || 0,
          taxAmount: milestone.amount * (contract.taxRate || 0) / 100,
          total: milestone.amount + (milestone.amount * (contract.taxRate || 0) / 100),
          
          // Additional info
          notes: `Payment for milestone: ${milestone.name} - ${milestone.description || ''}\nFrom contract: ${contract.name}`,
          
          // Progress billing reference
          progressContractId: contract.id,
          milestoneId: milestone.id,
          
          status: 'draft',
        })
        .returning();
      
      // Update the milestone with the invoice ID and status
      await db
        .update(progressMilestones)
        .set({
          invoiceId: newInvoice.id,
          invoicedAt: new Date(),
          status: 'invoiced',
          updatedAt: new Date(),
        })
        .where(eq(progressMilestones.id, milestoneId));
      
      // Update the contract's invoiced value
      await db
        .update(progressContracts)
        .set({
          invoicedValue: contract.invoicedValue + milestone.amount,
          remainingValue: contract.remainingValue - milestone.amount,
          updatedAt: new Date(),
        })
        .where(eq(progressContracts.id, contract.id));
      
      res.status(201).json({
        message: 'Invoice created successfully',
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber
      });
    } catch (error: any) {
      logError('Error generating invoice for milestone', error);
      res.status(500).json({ message: 'Failed to generate invoice', error: error.message });
    }
  }
);

/**
 * Helper function to get a contract with all its milestones
 */
async function getContractWithMilestones(contractId: number, userId?: number) {
  // Query to get the contract
  const contractQuery = db
    .select()
    .from(progressContracts)
    .where(eq(progressContracts.id, contractId));
  
  // If userId is provided, ensure the contract belongs to this user
  if (userId) {
    contractQuery.where(eq(progressContracts.userId, userId));
  }
  
  const [contract] = await contractQuery.limit(1);
  
  if (!contract) {
    return null;
  }
  
  // Get all milestones for this contract
  const milestones = await db
    .select()
    .from(progressMilestones)
    .where(eq(progressMilestones.contractId, contractId))
    .orderBy(progressMilestones.orderIndex);
  
  return {
    ...contract,
    milestones,
  };
}

export default router;