import bcrypt from "bcryptjs";
import { InventoryAction, OrderStatus, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    name: "Lucky Kumar",
    email: "lucky.admin@stockforge.io",
    password: "LuckydaAdmin@123",
    role: Role.ADMIN
  },
  {
    name: "Tony Stark",
    email: "toney.ops@stockforge.io",
    password: "Warehouse@123",
    role: Role.EMPLOYEE
  },
  {
    name: "Labubu",
    email: "labubu.floor@stockforge.io",
    password: "Operator@123",
    role: Role.EMPLOYEE
  }
];

const products = [
  ["CONS-CEREAL-IRONMAN-500", "IronMan Cereals", "Consumables", 182.45, 239.9, 124, 30],
  ["PKG-ILLULU-MILK", "Illulu Milk Cartons", "Packaging", 18.6, 25.4, 8, 20],
  ["SAFE-PANDA-GLOVE", "PandaGrip Gloves", "Safety", 28.75, 39.95, 19, 25],
  ["HW-GOBLIN-BOLT-M8", "Goblin Hardware super hard Lock Bolts M8", "Hardware", 142.3, 189.6, 87, 20],
  ["ELEC-THUNDER-2C", "ThunderSnake 2 Core", "Electrical", 1285.8, 1549.75, 6, 10],
  ["CLEAN-BUBBLIX-5L", "Bubbluuu Floor Wash", "Cleaning", 214.35, 289.5, 42, 12],
  ["SAFE-PANDA-HELMET", "Panda Express Helmets", "Safety", 278.4, 349.9, 0, 10],
  ["HW-UNICORN-BOLT", "Unicorn Bolts", "Hardware", 92.65, 124.8, 143, 30],
  ["CLEAN-GALACTIC-MOP", "Galactic Mop Refill", "Cleaning", 98.4, 132.75, 17, 20],
  ["SPARE-TURBODUCK", "Turbo Duck Bearings", "Spare Parts", 236.9, 305.45, 0, 8],
  ["ELEC-COFFEE-EXT", "Coffee Powered Extension Cable", "Electrical", 384.55, 469.25, 26, 10],
  ["STAT-ALIEN-PAPER", "Alien Office Paper", "Stationery", 248.2, 309.6, 78, 20],
  ["PKG-BANANA-CRATE", "Emergency Banana Crates", "Packaging", 86.75, 119.4, 0, 15],
  ["SPARE-BEARTRON", "BearTron", "Spare Parts", 164.25, 214.95, 38, 10],
  ["SPARE-ROBOTTOOTH", "RobotTooth", "Spare Parts", 458.8, 569.9, 4, 8],
  ["ELEC-SPARKMINT", "SparkMint", "Electrical", 184.9, 239.75, 31, 12],
  ["PKG-BUBBLEFORGE", "BubbleForge", "Packaging", 432.6, 548.25, 52, 20],
  ["PKG-TAPEKRAKEN", "TapeKraken", "Packaging", 52.45, 69.8, 118, 30],
  ["PKG-BOXASAUR", "Boxasaur", "Packaging", 28.95, 39.5, 165, 40],
  ["PKG-FLUFFWRAP", "FluffWrap", "Packaging", 402.15, 519.4, 9, 15]
] as const;

const receivingHistory = [
  ["PKG-BOXASAUR", "Kaveri Packaging Co.", 250, 7237.5],
  ["PKG-BUBBLEFORGE", "Metro Industrial Supplies", 60, 25956],
  ["SAFE-PANDA-GLOVE", "Prime Safety Traders", 120, 3450],
  ["ELEC-THUNDER-2C", "BlueLine Electricals", 15, 19287],
  ["HW-GOBLIN-BOLT-M8", "Omkar Hardware Depot", 100, 14230],
  ["CLEAN-BUBBLIX-5L", "Metro Industrial Supplies", 40, 8574],
  ["STAT-ALIEN-PAPER", "PaperNest Office Supplies", 90, 22338],
  ["ELEC-COFFEE-EXT", "BlueLine Electricals", 35, 13459.25]
] as const;

const dispatchHistory = [
  ["PKG-TAPEKRAKEN", 28],
  ["SAFE-PANDA-GLOVE", 36],
  ["ELEC-THUNDER-2C", 9],
  ["CLEAN-GALACTIC-MOP", 11],
  ["PKG-BOXASAUR", 42],
  ["STAT-ALIEN-PAPER", 20],
  ["HW-GOBLIN-BOLT-M8", 34],
  ["CONS-CEREAL-IRONMAN-500", 18]
] as const;

const orderShowcase = [
  {
    status: OrderStatus.FULFILLED,
    items: [
      ["PKG-BOXASAUR", 30, 30],
      ["PKG-TAPEKRAKEN", 25, 25],
      ["PKG-BUBBLEFORGE", 12, 12]
    ]
  },
  {
    status: OrderStatus.PARTIALLY_FULFILLED,
    items: [
      ["ELEC-THUNDER-2C", 10, 6],
      ["ELEC-SPARKMINT", 8, 8]
    ]
  },
  {
    status: OrderStatus.BACKORDERED,
    items: [
      ["SAFE-PANDA-HELMET", 15, 0],
      ["PKG-BANANA-CRATE", 20, 0]
    ]
  },
  {
    status: OrderStatus.FULFILLED,
    items: [
      ["STAT-ALIEN-PAPER", 15, 15],
      ["CONS-CEREAL-IRONMAN-500", 12, 12],
      ["CLEAN-BUBBLIX-5L", 8, 8]
    ]
  },
  {
    status: OrderStatus.PARTIALLY_FULFILLED,
    items: [
      ["SPARE-ROBOTTOOTH", 6, 4],
      ["SPARE-BEARTRON", 5, 5]
    ]
  }
] as const;

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.inventoryLog.deleteMany();
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.saleItem.deleteMany();
    await tx.sale.deleteMany();
    await tx.purchase.deleteMany();
    await tx.product.deleteMany();
    await tx.user.deleteMany();

    for (const user of users) {
      await tx.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash: await bcrypt.hash(user.password, 12),
          role: user.role
        }
      });
    }

    for (const [sku, name, category, purchasePrice, sellingPrice, stock, minStock] of products) {
      await tx.product.create({
        data: {
          sku,
          name,
          category,
          purchasePrice,
          sellingPrice,
          stock,
          minStock
        }
      });
    }

    const productsBySku = new Map(
      (await tx.product.findMany()).map((product) => [product.sku, product])
    );

    for (const [sku, supplierName, quantity, cost] of receivingHistory) {
      const product = productsBySku.get(sku);
      if (!product) continue;

      await tx.purchase.create({
        data: {
          productId: product.id,
          supplierName,
          quantity,
          cost
        }
      });

      await tx.inventoryLog.create({
        data: {
          productId: product.id,
          action: InventoryAction.PURCHASE,
          quantityChange: quantity,
          previousStock: Math.max(product.stock - quantity, 0),
          newStock: product.stock
        }
      });
    }

    for (const [sku, quantity] of dispatchHistory) {
      const product = productsBySku.get(sku);
      if (!product) continue;

      const sale = await tx.sale.create({
        data: {
          totalAmount: Number(product.sellingPrice) * quantity,
          totalProfit: (Number(product.sellingPrice) - Number(product.purchasePrice)) * quantity,
          items: {
            create: {
              productId: product.id,
              quantity,
              sellingPrice: product.sellingPrice,
              purchasePrice: product.purchasePrice
            }
          }
        }
      });

      await tx.inventoryLog.create({
        data: {
          productId: product.id,
          action: InventoryAction.SALE,
          quantityChange: -quantity,
          previousStock: product.stock + quantity,
          newStock: product.stock
        }
      });

      await tx.sale.update({
        where: { id: sale.id },
        data: {}
      });
    }

    for (const order of orderShowcase) {
      const totals = order.items.reduce(
        (sum, [, requested, fulfilled]) => ({
          requested: sum.requested + requested,
          fulfilled: sum.fulfilled + fulfilled,
          backordered: sum.backordered + requested - fulfilled
        }),
        { requested: 0, fulfilled: 0, backordered: 0 }
      );

      await tx.order.create({
        data: {
          status: order.status,
          totalRequested: totals.requested,
          totalFulfilled: totals.fulfilled,
          totalBackordered: totals.backordered,
          items: {
            create: order.items.map(([sku, requestedQuantity, fulfilledQuantity]) => {
              const product = productsBySku.get(sku);
              if (!product) throw new Error(`Missing product for SKU ${sku}`);

              return {
                productId: product.id,
                requestedQuantity,
                fulfilledQuantity,
                backorderedQuantity: requestedQuantity - fulfilledQuantity,
                unitPrice: product.sellingPrice
              };
            })
          }
        }
      });
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
