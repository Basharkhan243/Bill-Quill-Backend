import mongoose from 'mongoose';


const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  description: String,
  sku: String,
}, { _id: true });

const customerSchema = new mongoose.Schema({
  name: String,
  customerId: String,
  address: String,
  phone: String,
  gstin: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [productSchema]
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
