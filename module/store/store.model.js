const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    storeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    storeName: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    zone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    geofenceRadiusMeters: { type: Number, default: 200 },
    openingTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    closingTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'CLOSED'], default: 'ACTIVE' },
    managerId: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Store', storeSchema);