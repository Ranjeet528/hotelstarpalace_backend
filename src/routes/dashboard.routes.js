import express from "express";
import {
  getDashboardStats,
  getRoomDistribution,
 
  getRecentPayments,
  getBookingSources,
  getPaymentStatusSummary,
  getTopCustomers,
  getMonthlyRevenue,
  getOccupancyReport,
  getTodayActivities,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

// Dashboard
router.get("/", getDashboardStats);

// Charts
router.get("/room-distribution", getRoomDistribution);
router.get("/monthly-revenue", getMonthlyRevenue);
router.get("/booking-sources", getBookingSources);
router.get("/payment-summary", getPaymentStatusSummary);
router.get("/occupancy-report", getOccupancyReport);


// Payments
router.get("/recent-payments", getRecentPayments);

// Customers
router.get("/top-customers", getTopCustomers);

// Activities
router.get("/today-activities", getTodayActivities);

export default router;