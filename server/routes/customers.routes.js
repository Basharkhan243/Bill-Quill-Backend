import express from "express";
import {
  getCustomerProducts,
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addProductToCustomer,
  exportCustomers,
  deleteProductFromCustomer,
  getCustomersWithProducts
} from "../controller/customers.controller.js";
import { verifyJWT } from "../middleware/auth.middlewares.js";

const router = express.Router();

// Protect all routes
router.use(verifyJWT);

/* -------------------- Export -------------------- */
// Keep this above /:id route to avoid conflicts
// Example: /customers/export/excel OR /customers/export/csv
router.get("/export/:format", exportCustomers);

/* -------------------- Customer CRUD -------------------- */
router.get("/", getCustomers);             // Get all customers
router.post("/", createCustomer);          // Create new customer
router.get("/:id", getCustomer);           // Get single customer
router.put("/:id", updateCustomer);        // Update customer
router.delete("/:id", deleteCustomer);     // Delete customer

/* -------------------- Products inside Customer -------------------- */
router.post("/:id/products", addProductToCustomer);      // Add product for a customer
router.delete("/:id/products/:productId", deleteProductFromCustomer); // Delete product for a customer
router.get("/:id/products", getCustomerProducts);
router.get('/with-products', getCustomersWithProducts);

export default router;
