import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin123", 12);
  const storeHash = await bcrypt.hash("store123", 12);

  // Admin — full dashboard access
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: adminHash,
      role: Role.ADMIN
    }
  });

  // Retailer / store operator — goes to /store PWA
  await prisma.user.upsert({
    where: { email: "store@example.com" },
    update: {},
    create: {
      name: "Store Operator",
      email: "store@example.com",
      passwordHash: storeHash,
      role: Role.EMPLOYEE
    }
  });

  await prisma.product.upsert({
    where: { sku: "COF-001" },
    update: {},
    create: {
      name: "Ground Coffee 250g",
      sku: "COF-001",
      category: "Grocery",
      purchasePrice: 4.5,
      sellingPrice: 7.99,
      stock: 50,
      minStock: 10
    }
  });

  await prisma.product.upsert({
    where: { sku: "TEA-001" },
    update: {},
    create: {
      name: "Black Tea 100 Bags",
      sku: "TEA-001",
      category: "Grocery",
      purchasePrice: 3.25,
      sellingPrice: 5.99,
      stock: 35,
      minStock: 8
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
