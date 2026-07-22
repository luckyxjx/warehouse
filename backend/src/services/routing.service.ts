import { AppError } from "../utils/AppError";
import { money } from "../utils/decimal";

type QuoteInput = {
  originPincode: string;
  destinationPincode: string;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

type Zone = "LOCAL" | "REGIONAL" | "NATIONAL";

type Vehicle = {
  code: string;
  name: string;
  capacityKg: number;
  baseFare: number;
  perKgRate: number;
};

const vehicles: Vehicle[] = [
  { code: "BIKE", name: "Bike", capacityKg: 20, baseFare: 40, perKgRate: 8 },
  { code: "VAN", name: "Mini Van", capacityKg: 250, baseFare: 450, perKgRate: 5 },
  { code: "TRUCK", name: "Small Truck", capacityKg: 1000, baseFare: 1200, perKgRate: 3.5 }
];

const zoneMultipliers: Record<Zone, number> = {
  LOCAL: 1,
  REGIONAL: 1.35,
  NATIONAL: 1.8
};

export class RoutingService {
  quote(input: QuoteInput) {
    const zone = this.resolveZone(input.originPincode, input.destinationPincode);
    const volumetricWeightKg = this.calculateVolumetricWeight(input);
    const billableWeightKg = Math.max(input.actualWeightKg, volumetricWeightKg);

    const options = vehicles.map((vehicle) => {
      const vehicleCount = Math.ceil(billableWeightKg / vehicle.capacityKg);
      const cost = vehicleCount * vehicle.baseFare + billableWeightKg * vehicle.perKgRate * zoneMultipliers[zone];

      return {
        vehicleCode: vehicle.code,
        vehicleName: vehicle.name,
        vehicleCapacityKg: vehicle.capacityKg,
        vehicleCount,
        totalCost: money(cost),
        feasible: true,
        reason: vehicleCount > 1
          ? `Split across ${vehicleCount} ${vehicle.name} vehicles because billable weight exceeds one vehicle capacity.`
          : `Fits in one ${vehicle.name}.`
      };
    });

    const cheapest = options.reduce((best, option) =>
      option.totalCost < best.totalCost ? option : best
    );

    return {
      originPincode: input.originPincode,
      destinationPincode: input.destinationPincode,
      zone,
      actualWeightKg: input.actualWeightKg,
      volumetricWeightKg: money(volumetricWeightKg),
      billableWeightKg: money(billableWeightKg),
      options,
      selectedOption: cheapest,
      justification: `Selected ${cheapest.vehicleName} because it has the lowest total cost after applying ${zone.toLowerCase()} zone rates and vehicle capacity splitting.`
    };
  }

  private resolveZone(originPincode: string, destinationPincode: string): Zone {
    if (!/^\d{6}$/.test(originPincode) || !/^\d{6}$/.test(destinationPincode)) {
      throw new AppError(400, "Pincodes must be 6 digits", "INVALID_PINCODE");
    }

    if (originPincode.slice(0, 2) === destinationPincode.slice(0, 2)) {
      return "LOCAL";
    }

    if (originPincode[0] === destinationPincode[0]) {
      return "REGIONAL";
    }

    return "NATIONAL";
  }

  private calculateVolumetricWeight(input: QuoteInput) {
    return (input.lengthCm * input.widthCm * input.heightCm) / 5000;
  }
}
