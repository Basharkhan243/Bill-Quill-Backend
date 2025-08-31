import { asyncHandler } from "../utils/Asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Customer } from "../models/customers.model.js";
import { exportToExcel } from "../utils/excelgenerator.js";

/* -------------------- Get All Customers -------------------- */
const getCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (page - 1) * limit;

  let filter = { createdBy: req.user._id };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { customerId: { $regex: search, $options: "i" } }
    ];
  }

  const customers = await Customer.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Customer.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        customers,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCustomers: total
      },
      "Customers fetched successfully"
    )
  );
});

/* -------------------- Get Single Customer -------------------- */
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    createdBy: req.user._id
  });

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  res.status(200).json(
    new ApiResponse(200, customer, "Customer fetched successfully")
  );
});

/* -------------------- Create Customer -------------------- */
const createCustomer = asyncHandler(async (req, res) => {
  const { name, customerId, address, phone, gstin } = req.body;

  if (!name || !customerId) {
    throw new ApiError(400, "Name and Customer ID are required");
  }

  const existingCustomer = await Customer.findOne({
    customerId,
    createdBy: req.user._id
  });

  if (existingCustomer) {
    throw new ApiError(400, "Customer ID already exists");
  }

  const customer = await Customer.create({
    name,
    customerId,
    address,
    phone,
    gstin,
    createdBy: req.user._id
  });

  res.status(201).json(
    new ApiResponse(201, customer, "Customer created successfully")
  );
});

/* -------------------- Update Customer -------------------- */
const updateCustomer = asyncHandler(async (req, res) => {
  const { name, address, phone, gstin } = req.body;

  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    { name, address, phone, gstin },
    { new: true, runValidators: true }
  );

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  res.status(200).json(
    new ApiResponse(200, customer, "Customer updated successfully")
  );
});

/* -------------------- Delete Customer -------------------- */
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.user._id
  });

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  res.status(200).json(
    new ApiResponse(200, null, "Customer deleted successfully")
  );
});

/* -------------------- Add Product to Customer -------------------- */
const addProductToCustomer = asyncHandler(async (req, res) => {
  const { name, quantity, price } = req.body;
  if (!name || quantity == null || price == null) {
    throw new ApiError(400, "Product name, quantity, and price are required");
  }

  const customer = await Customer.findOne({
    _id: req.params.id,
    createdBy: req.user._id
  });
  if (!customer) throw new ApiError(404, "Customer not found");

  // Check if product already exists for customer
  const existingProduct = customer.products.find(p => p.name === name);
  if (existingProduct) {
    existingProduct.quantity += quantity; // increment quantity
    existingProduct.price = price; // update price if needed
  } else {
    customer.products.push({ name, quantity, price });
  }

  await customer.save();
  res.status(200).json(new ApiResponse(200, customer, "Product added/updated successfully"));
});


// Delete product from customer
 const deleteProductFromCustomer = asyncHandler(async (req, res) => {
const { id, productId } = req.params;
const customer = await Customer.findById(id);


if (!customer) {
throw new ApiError(404, "Customer not found");
}


const initialLength = customer.products.length;
customer.products = customer.products.filter(p => p._id.toString() !== productId);


if (customer.products.length === initialLength) {
throw new ApiError(404, "Product not found");
}


await customer.save();


res.status(200).json(new ApiResponse(200, customer, "Product deleted successfully"));
});

/* -------------------- Export Customers & Products -------------------- */
const exportCustomers = asyncHandler(async (req, res) => {
  const { format = "excel" } = req.params;
  const customers = await Customer.find({ createdBy: req.user._id });

  if (customers.length === 0) {
    throw new ApiError(404, "No customers found to export");
  }

  let grandTotal = 0;
  const data = [];

  customers.forEach((customer) => {
    if (customer.products && customer.products.length > 0) {
      customer.products.forEach((p) => {
        const cost = p.quantity * p.price;
        grandTotal += cost;

        data.push({
          "Customer ID": customer.customerId,
          Name: customer.name,
          Phone: customer.phone || "",
          Product: p.name,
          Quantity: p.quantity,
          Price: p.price,
          "Line Total": cost,
          "Created At": customer.createdAt.toLocaleDateString()
        });
      });
    } else {
      data.push({
        "Customer ID": customer.customerId,
        Name: customer.name,
        Phone: customer.phone || "",
        Product: "N/A",
        Quantity: 0,
        Price: 0,
        "Line Total": 0,
        "Created At": customer.createdAt.toLocaleDateString()
      });
    }
  });

  // Add Grand Total row at the end
  data.push({
    "Customer ID": "",
    Name: "TOTAL",
    Phone: "",
    Product: "",
    Quantity: "",
    Price: "",
    "Line Total": grandTotal,
    "Created At": ""
  });

  const fileName = `customers_export_${Date.now()}`;
  const fileBuffer = await exportToExcel(data, fileName, format);

  if (format === "excel") {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}.xlsx`
    );
  } else {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}.csv`
    );
  }

  res.send(fileBuffer);
});
// Get products for a single customer
// In your customer controller
const getCustomerProducts = asyncHandler(async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Find customer and verify ownership
    const customer = await Customer.findOne({
      _id: customerId,
      createdBy: req.user._id
    }).select("products");
    
    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    res.status(200).json(
      new ApiResponse(200, { data: customer.products || [] }, "Customer products fetched successfully")
    );
  } catch (err) {
    throw new ApiError(500, "Failed to fetch customer products");
  }
});
// Get all customers with their products
const getCustomersWithProducts = asyncHandler(async (req, res) => {
  try {
    const customers = await Customer.find({ createdBy: req.user._id })
      .populate('products') // This assumes you have a products array in your Customer model
      .sort({ name: 1 });

    res.status(200).json(
      new ApiResponse(200, customers, "Customers with products fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Failed to fetch customers with products: " + error.message);
  }
});

export {
  getCustomers,
  getCustomer,
  getCustomerProducts,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addProductToCustomer,
  exportCustomers,
  deleteProductFromCustomer,
  getCustomersWithProducts
};
