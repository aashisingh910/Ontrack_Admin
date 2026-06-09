const mongoose = require("mongoose");

const managerObjectSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    contactNumber: String,
    remark: String,
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    address: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    mapLocationUrl: String,
    geofenceRadiusMeters: Number,
  },
  { _id: false }
);

const storeSchema = new mongoose.Schema(
  {
    storeCode: { type: String, required: true, trim: true, index: true },
    storeName: { type: String, required: true, trim: true },
    city: String,
    state: String,
    region: String,
    zone: String,
    address: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    geofenceRadiusMeters: { type: Number, default: 200 },
    openingTime: { type: String, default: "10:00" },
    closingTime: { type: String, default: "22:00" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    managerId: { type: String, default: null, trim: true },
    managerName: String,
    managerEmail: String,
    managerContactNumber: String,
    managerRemark: String,
    manager: managerObjectSchema,
    mapLocationUrl: String,
    subZoneAreaLocality: String,
    location: locationSchema,
  },
  { timestamps: true, collection: "stores" }
);

module.exports = mongoose.models.Store || mongoose.model("Store", storeSchema);
