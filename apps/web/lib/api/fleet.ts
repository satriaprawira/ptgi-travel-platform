import { apiRequest } from "./client";

// Mirrors the response DTOs in apps/api/src/vehicles and apps/api/src/drivers.

export type VehicleStatus = "active" | "maintenance" | "retired";
export type DriverStatus = "active" | "off_duty" | "inactive";

export interface VehicleClass {
  id: string;
  code: string;
  name: string;
}

export interface Vehicle {
  id: string;
  model: string;
  plateNumber: string;
  vehicleClass: VehicleClass;
  capacityPax: number;
  capacityBags: number;
  status: VehicleStatus;
  assignedDriver: { id: string; fullName: string } | null;
}

export interface VehicleInput {
  vehicleClassId: string;
  model: string;
  plateNumber: string;
  capacityPax: number;
  capacityBags: number;
  status: VehicleStatus;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string | null;
  status: DriverStatus;
  vehicle: { id: string; model: string; plateNumber: string; vehicleClassName: string } | null;
}

export interface DriverInput {
  fullName: string;
  phone: string;
  licenseNumber: string | null;
  vehicleId: string | null;
  status: DriverStatus;
}

export const listVehicleClasses = () => apiRequest<VehicleClass[]>("/admin/vehicle-classes");

export const listVehicles = () => apiRequest<Vehicle[]>("/admin/vehicles");
export const createVehicle = (input: VehicleInput) =>
  apiRequest<Vehicle>("/admin/vehicles", { method: "POST", body: input });
export const updateVehicle = (id: string, input: Partial<VehicleInput>) =>
  apiRequest<Vehicle>(`/admin/vehicles/${id}`, { method: "PATCH", body: input });
export const deleteVehicle = (id: string) => apiRequest<void>(`/admin/vehicles/${id}`, { method: "DELETE" });

export const listDrivers = () => apiRequest<Driver[]>("/admin/drivers");
export const createDriver = (input: DriverInput) =>
  apiRequest<Driver>("/admin/drivers", { method: "POST", body: input });
export const updateDriver = (id: string, input: Partial<DriverInput>) =>
  apiRequest<Driver>(`/admin/drivers/${id}`, { method: "PATCH", body: input });
export const deleteDriver = (id: string) => apiRequest<void>(`/admin/drivers/${id}`, { method: "DELETE" });
