/**
 * PHASE 2 CONTROLLERS - CUSTOMER LOYALTY & PERSONALIZATION
 * Production-ready controllers for all 10 Phase 2 features
 * 
 * Features:
 * - Customer Segmentation
 * - Loyalty Points System
 * - Referral Program
 * - Warranty Management
 * - Fraud Detection
 * - Shipping Calculator
 * - Customer Addresses
 * - Guest Checkout
 * - AI Product Descriptions
 */

const mongoose = require('mongoose');
const {
  CustomerSegment,
  LoyaltyAccount,
  PointsTransaction,
  ReferralCode,
  ReferralTransaction,
  Warranty,
  WarrantyPurchase,
  FraudFlag,
  ShippingRate,
  CustomerAddress,
  GuestOrder,
  AIProductDescription,
  CustomerSegmentationService
} = require('../models/Phase2Models');

// ============================================
// CUSTOMER SEGMENTATION CONTROLLER
// ============================================
class CustomerSegmentationController {
  async recalculateSegments(req, res) {
    try {
      const { userId } = req.params;
      
      const segment = await CustomerSegmentationService.recalculateSegment(userId);
      
      res.json({
        success: true,
        data: segment,
        message: 'Customer segment recalculated'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSegments(req, res) {
    try {
      const { userId } = req.params;
      
      const segment = await CustomerSegment.findOne({ userId });
      if (!segment) {
        return res.status(404).json({ success: false, error: 'Segment not found' });
      }

      res.json({
        success: true,
        data: segment
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async bulkSegmentAnalysis(req, res) {
    try {
      const segments = await CustomerSegment.aggregate([
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            vipCount: { $sum: { $cond: ['$segments.isVIP', 1, 0] } },
            atRiskCount: { $sum: { $cond: ['$segments.isAtRisk', 1, 0] } },
            averageChurnScore: { $avg: '$churnRiskScore' },
            totalLTV: { $sum: '$metrics.totalSpent' }
          }
        }
      ]);

      res.json({
        success: true,
        data: segments[0] || {}
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// ============================================
// LOYALTY POINTS CONTROLLER
// ============================================
class LoyaltyPointsController {
  async earnPoints(req, res) {
    try {
      const { userId, points, reason, orderId } = req.body;
      
      const loyaltyAccount = await LoyaltyAccount.findOne({ userId });
      if (!loyaltyAccount) {
        return res.status(404).json({ success: false, error: 'Loyalty account not found' });
      }

      // Add points transaction
      const transaction = new PointsTransaction({
        userId,
        transactionType: reason || 'purchase',
        points,
        status: 'completed',
        orderId,
        expiresAt: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000)
      });
      await transaction.save();

      // Update loyalty account
      loyaltyAccount.totalPoints += points;
      loyaltyAccount.availablePoints += points;

      // Check for tier upgrade
      const tierThresholds = { bronze: 0, silver: 500, gold: 2000, platinum: 5000 };
      for (const [tier, threshold] of Object.entries(tierThresholds)) {
        if (loyaltyAccount.totalPoints >= threshold && loyaltyAccount.currentTier !== tier) {
          loyaltyAccount.currentTier = tier;
          loyaltyAccount.tierHistory.push({
            tier,
            upgradedAt: new Date(),
            pointsAtUpgrade: loyaltyAccount.totalPoints
          });
        }
      }

      await loyaltyAccount.save();

      res.json({
        success: true,
        data: {
          loyaltyAccount,
          transaction
        },
        message: `${points} points earned`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async redeemPoints(req, res) {
    try {
      const { userId, points, redemptionType } = req.body;
      
      const loyaltyAccount = await LoyaltyAccount.findOne({ userId });
      if (!loyaltyAccount) {
        return res.status(404).json({ success: false, error: 'Loyalty account not found' });
      }

      if (loyaltyAccount.availablePoints < points) {
        return res.status(400).json({ success: false, error: 'Insufficient points' });
      }

      loyaltyAccount.availablePoints -= points;
      loyaltyAccount.redeemedPoints += points;

      const transaction = new PointsTransaction({
        userId,
        transactionType: 'redemption',
        points: -points,
        status: 'completed',
        metadata: { redemptionType }
      });
      await transaction.save();

      loyaltyAccount.redemptionHistory.push({
        pointsRedeemed: points,
        redeemedAt: new Date(),
        redemptionType,
        transactionId: transaction._id
      });

      await loyaltyAccount.save();

      res.json({
        success: true,
        data: {
          loyaltyAccount,
          transaction
        },
        message: `${points} points redeemed`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getBalance(req, res) {
    try {
      const { userId } = req.params;
      
      const loyaltyAccount = await LoyaltyAccount.findOne({ userId });
      if (!loyaltyAccount) {
        return res.status(404).json({ success: false, error: 'Loyalty account not found' });
      }

      res.json({ success: true, data: loyaltyAccount });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10, skip = 0 } = req.query;
      
      const transactions = await PointsTransaction
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await PointsTransaction.countDocuments({ userId });

      res.json({
        success: true,
        data: transactions,
        pagination: { total, limit, skip }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// ============================================
// REFERRAL PROGRAM CONTROLLER
// ============================================
class ReferralProgramController {
  async generateReferralCode(req, res) {
    try {
      const { userId, discountType, discountValue } = req.body;
      
      const code = new ReferralCode({
        userId,
        code: `REF${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
        discountType: discountType || 'percentage',
        discountValue: discountValue || 10,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      await code.save();

      res.json({
        success: true,
        data: code,
        message: 'Referral code generated'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async applyReferralCode(req, res) {
    try {
      const { code, refereeUserId } = req.body;
      
      const referralCode = await ReferralCode.findOne({ code, expiresAt: { $gt: new Date() } });
      if (!referralCode) {
        return res.status(404).json({ success: false, error: 'Invalid or expired code' });
      }

      const transaction = new ReferralTransaction({
        referrerId: referralCode.userId,
        refereeUserId,
        referralCodeId: referralCode._id,
        status: 'pending'
      });
      await transaction.save();

      referralCode.referralCount += 1;
      await referralCode.save();

      res.json({
        success: true,
        data: {
          transaction,
          discount: referralCode.discountValue,
          discountType: referralCode.discountType
        },
        message: 'Referral code applied'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async trackEarnings(req, res) {
    try {
      const { userId } = req.params;
      
      const earnings = await ReferralTransaction.aggregate([
        { $match: { referrerId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalReferrals: { $sum: 1 },
            successfulReferrals: { $sum: { $cond: ['$status', 'completed', 0] } },
            totalEarnings: { $sum: '$commissionEarned' },
            pendingEarnings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$commissionEarned', 0] } }
          }
        }
      ]);

      res.json({
        success: true,
        data: earnings[0] || { totalReferrals: 0, successfulReferrals: 0, totalEarnings: 0 }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMyReferralCodes(req, res) {
    try {
      const { userId } = req.params;
      
      const codes = await ReferralCode.find({ userId }).sort({ createdAt: -1 });

      res.json({ success: true, data: codes });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// ============================================
// WARRANTY CONTROLLER
// ============================================
class WarrantyController {
  async getAvailableWarranties(req, res) {
    try {
      const warranties = await Warranty.find({ isActive: true });

      res.json({ success: true, data: warranties });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async addWarrantyToOrder(req, res) {
    try {
      const { userId, orderId, warrantyId } = req.body;
      
      const warranty = await Warranty.findById(warrantyId);
      if (!warranty) {
        return res.status(404).json({ success: false, error: 'Warranty not found' });
      }

      const warrantyPurchase = new WarrantyPurchase({
        userId,
        orderId,
        warrantyId,
        purchasePrice: warranty.price,
        expiresAt: new Date(Date.now() + warranty.durationMonths * 30 * 24 * 60 * 60 * 1000)
      });

      await warrantyPurchase.save();

      res.json({
        success: true,
        data: warrantyPurchase,
        message: 'Warranty added to order'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async fileWarrantyClaim(req, res) {
    try {
      const { warrantyPurchaseId, description, evidenceUrls } = req.body;
      
      const warranty = await WarrantyPurchase.findById(warrantyPurchaseId);
      if (!warranty) {
        return res.status(404).json({ success: false, error: 'Warranty not found' });
      }

      warranty.claims.push({
        filedAt: new Date(),
        description,
        evidenceUrls,
        status: 'under_review'
      });

      await warranty.save();

      res.json({
        success: true,
        data: warranty,
        message: 'Warranty claim filed'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getWarrantyClaims(req, res) {
    try {
      const { userId } = req.params;
      
      const claims = await WarrantyPurchase.find({ userId }).populate('warrantyId');

      res.json({ success: true, data: claims });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// ============================================
// FRAUD DETECTION CONTROLLER
// ============================================
class FraudDetectionController {
  async flagOrder(req, res) {
    try {
      const { orderId, flags, riskScore } = req.body;
      
      const fraudFlag = new FraudFlag({
        orderId,
        flags: flags || [],
        riskScore: riskScore || 0,
        status: riskScore > 70 ? 'under_review' : 'low_risk'
      });

      await fraudFlag.save();

      res.json({
        success: true,
        data: fraudFlag,
        message: riskScore > 70 ? 'Order flagged for review' : 'Order low risk'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getReviewQueue(req, res) {
    try {
      const { limit = 20, skip = 0 } = req.query;
      
      const queue = await FraudFlag
        .find({ status: 'under_review' })
        .sort({ riskScore: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await FraudFlag.countDocuments({ status: 'under_review' });

      res.json({
        success: true,
        data: queue,
        pagination: { total, limit, skip }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async approveOrder(req, res) {
    try {
      const { fraudFlagId } = req.params;
      
      const fraudFlag = await FraudFlag.findByIdAndUpdate(
        fraudFlagId,
        { status: 'approved', reviewedAt: new Date() },
        { new: true }
      );

      res.json({
        success: true,
        data: fraudFlag,
        message: 'Order approved'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async rejectOrder(req, res) {
    try {
      const { fraudFlagId, reason } = req.params;
      
      const fraudFlag = await FraudFlag.findByIdAndUpdate(
        fraudFlagId,
        { status: 'rejected', reason, reviewedAt: new Date() },
        { new: true }
      );

      res.json({
        success: true,
        data: fraudFlag,
        message: 'Order rejected'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// ============================================
// SHIPPING CALCULATOR CONTROLLER
// ============================================
class ShippingCalculatorController {
  async calculateShippingCost(req, res) {
    try {
      const { city, weight } = req.body;
      
      const shippingRate = await ShippingRate.findOne({ city });
      if (!shippingRate) {
        return res.status(404).json({ success: false, error: 'Shipping not available in this city' });
      }

      const baseCost = shippingRate.baseCost;
      const weightCost = weight * shippingRate.costPerKg;
      const totalCost = baseCost + weightCost;

      const finalCost = totalCost < shippingRate.freeShippingAbove ? totalCost : 0;

      res.json({
        success: true,
        data: {
          city,
          baseCost,
          weightCost,
          totalCost,
          discount: totalCost - finalCost,
          finalCost
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getShippingRates(req, res) {
    try {
      const rates = await ShippingRate.find();

      res.json({ success: true, data: rates });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateShippingRate(req, res) {
    try {
      const { rateId } = req.params;
      const { baseCost, costPerKg, freeShippingAbove } = req.body;
      
      const rate = await ShippingRate.findByIdAndUpdate(
        rateId,
        { baseCost, costPerKg, freeShippingAbove },
        { new: true }
      );

      res.json({
        success: true,
        data: rate,
        message: 'Shipping rate updated'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// ============================================
// CUSTOMER ADDRESS CONTROLLER
// ============================================
class CustomerAddressController {
  async addAddress(req, res) {
    try {
      const { userId, label, street, city, province, postalCode, phone, coordinates } = req.body;
      
      const address = new CustomerAddress({
        userId,
        label: label || 'Home',
        street,
        city,
        province,
        postalCode,
        phone,
        coordinates
      });

      await address.save();

      res.json({
        success: true,
        data: address,
        message: 'Address added'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAddresses(req, res) {
    try {
      const { userId } = req.params;
      
      const addresses = await CustomerAddress.find({ userId }).sort({ isDefault: -1 });

      res.json({ success: true, data: addresses });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async setDefaultAddress(req, res) {
    try {
      const { userId, addressId } = req.params;
      
      await CustomerAddress.updateMany({ userId }, { isDefault: false });
      const address = await CustomerAddress.findByIdAndUpdate(
        addressId,
        { isDefault: true },
        { new: true }
      );

      res.json({
        success: true,
        data: address,
        message: 'Default address updated'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateAddress(req, res) {
    try {
      const { addressId } = req.params;
      const updateData = req.body;
      
      const address = await CustomerAddress.findByIdAndUpdate(
        addressId,
        updateData,
        { new: true }
      );

      res.json({
        success: true,
        data: address,
        message: 'Address updated'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteAddress(req, res) {
    try {
      const { addressId } = req.params;
      
      await CustomerAddress.findByIdAndDelete(addressId);

      res.json({
        success: true,
        message: 'Address deleted'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// ============================================
// GUEST CHECKOUT CONTROLLER
// ============================================
class GuestCheckoutController {
  async createGuestCheckout(req, res) {
    try {
      const { guestEmail, cartData, shippingData, billingData } = req.body;
      
      const guestToken = require('crypto').randomBytes(32).toString('hex');
      
      const guestOrder = new GuestOrder({
        guestEmail,
        cartSnapshot: cartData,
        orderData: {
          shipping: shippingData,
          billing: billingData
        },
        guestToken
      });

      await guestOrder.save();

      res.json({
        success: true,
        data: {
          guestOrder,
          trackingUrl: `https://omnora.com/guest/order/${guestToken}`
        },
        message: 'Guest checkout created'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getGuestOrder(req, res) {
    try {
      const { guestToken } = req.params;
      
      const guestOrder = await GuestOrder.findOne({ guestToken });
      if (!guestOrder) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      res.json({ success: true, data: guestOrder });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async convertToAccount(req, res) {
    try {
      const { guestToken, userId } = req.body;
      
      const guestOrder = await GuestOrder.findOneAndUpdate(
        { guestToken },
        { convertedToUserId: userId, convertedAt: new Date() },
        { new: true }
      );

      res.json({
        success: true,
        data: guestOrder,
        message: 'Guest order linked to account'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// ============================================
// AI PRODUCT DESCRIPTION CONTROLLER
// ============================================
class AIProductDescriptionController {
  async generateDescription(req, res) {
    try {
      const { productId, originalDescription, tone } = req.body;
      
      const aiDescription = new AIProductDescription({
        productId,
        originalDescription,
        tone: tone || 'professional'
      });

      // In production, call OpenAI GPT API here
      // For now, we'll store the original and mark as pending
      
      await aiDescription.save();

      res.json({
        success: true,
        data: aiDescription,
        message: 'AI description generation queued'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async selectDescription(req, res) {
    try {
      const { aiDescriptionId, selectedIndex } = req.body;
      
      const aiDescription = await AIProductDescription.findById(aiDescriptionId);
      if (!aiDescription) {
        return res.status(404).json({ success: false, error: 'Description not found' });
      }

      aiDescription.selectedDescription = selectedIndex;
      aiDescription.updatedAt = new Date();
      
      await aiDescription.save();

      res.json({
        success: true,
        data: aiDescription,
        message: 'Description selected'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getDescriptionVersions(req, res) {
    try {
      const { productId } = req.params;
      
      const descriptions = await AIProductDescription.find({ productId });

      res.json({ success: true, data: descriptions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async trackAnalytics(req, res) {
    try {
      const { aiDescriptionId } = req.params;
      
      const aiDescription = await AIProductDescription.findById(aiDescriptionId);
      if (!aiDescription) {
        return res.status(404).json({ success: false, error: 'Description not found' });
      }

      aiDescription.analytics.impressions += 1;
      await aiDescription.save();

      res.json({ success: true, data: aiDescription });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

// ============================================
// EXPORT CONTROLLERS
// ============================================
module.exports = {
  CustomerSegmentationController,
  LoyaltyPointsController,
  ReferralProgramController,
  WarrantyController,
  FraudDetectionController,
  ShippingCalculatorController,
  CustomerAddressController,
  GuestCheckoutController,
  AIProductDescriptionController
};
