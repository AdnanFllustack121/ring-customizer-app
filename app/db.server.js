// import { PrismaClient } from "@prisma/client";

// const prisma = global.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") {
//   if (!global.prisma) {
//     global.prisma = new PrismaClient();
//   }
// }

// export default prisma;

import mongoose, { Schema } from "mongoose";

main().catch(err => console.log('mongoose.connect err', err))

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/ring_customizer_app')
}

export const Session = mongoose.models.Session || mongoose.model('Session', new Schema({}, { strict: false, collection: 'shopify_sessions' }))
export const Files = mongoose.model('Files', new Schema({}, { strict: false, collection: 'files' }))
export const Products = mongoose.model('Products', new Schema({}, { strict: false, collection: 'products' }))