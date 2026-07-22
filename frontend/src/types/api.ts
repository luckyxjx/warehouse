export type Role = "ADMIN" | "EMPLOYEE";

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: Pagination;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = "FULFILLED" | "PARTIALLY_FULFILLED" | "BACKORDERED";

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  backorderedQuantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  totalRequested: number;
  totalFulfilled: number;
  totalBackordered: number;
  createdAt: string;
  items: OrderItem[];
};

export type RoutingQuoteOption = {
  vehicleCode: string;
  vehicleName: string;
  vehicleCapacityKg: number;
  vehicleCount: number;
  totalCost: number;
  feasible: boolean;
  reason: string;
};

export type RoutingQuote = {
  originPincode: string;
  destinationPincode: string;
  zone: "LOCAL" | "REGIONAL" | "NATIONAL";
  actualWeightKg: number;
  volumetricWeightKg: number;
  billableWeightKg: number;
  options: RoutingQuoteOption[];
  selectedOption: RoutingQuoteOption;
  justification: string;
};

export type DashboardOverview = {
  totalProducts: number;
  totalInventoryValue: number;
  todaySales: number;
  todayProfit: number;
  lowStockProducts: Product[];
};

export type TopProduct = {
  productId: string;
  productName: string;
  sku?: string;
  unitsSold: number;
};

export type ProductPerformance = {
  productName: string;
  unitsSold: number;
  revenue: number;
  profit: number;
};

export type MonthlyReport = {
  year: number;
  month: number;
  revenue: number;
  profit: number;
  expenses: number;
  bestSellingProducts: Array<{
    productId: string;
    productName: string;
    unitsSold: number;
    revenue: number;
  }>;
};

export type InventoryLog = {
  id: string;
  productId: string;
  productName?: string;
  action: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  createdAt: string;
};

export type Purchase = {
  id: string;
  productId: string;
  productName?: string;
  supplierName?: string;
  quantity: number;
  cost: number;
  createdAt: string;
};

export type TrendPoint = {
  date: string;
  revenue: number;
  profit: number;
  sales: number;
};

export type ReportStatus = "DRAFT" | "FINALIZED";

export type FinalizedReport = {
  id: string;
  year: number;
  month: number;
  status: ReportStatus;
  notes: string | null;
  pdfPath: string | null;
  pdfFileName: string | null;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
  summary: MonthlyReport;
};

export type ReportExportSummary = {
  year: number;
  month: number;
  revenue: number;
  profit: number;
  expenses: number;
  bestSellingProducts: Array<{
    productId: string;
    productName: string;
    unitsSold: number;
    revenue: number;
  }>;
};

export type ReportExportData = {
  period: { year: number; month: number; label: string; exportedAt: string };
  summary: ReportExportSummary;
  salesDetail: Record<string, unknown>[];
  purchasesDetail: Record<string, unknown>[];
  inventoryMovement: Record<string, unknown>[];
  closingStock: Record<string, unknown>[];
};
