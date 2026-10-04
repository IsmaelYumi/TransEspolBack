export enum UserRole {
  PASSENGER = 'PASSENGER',
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN',
  // Aliases for institutional clarity
  STUDENT = 'PASSENGER',
  DRIVER = 'OPERATOR',
  DISPATCHER = 'OPERATOR',
}

export enum RouteDirection {
  INBOUND = 'INBOUND',   // ENTRADA hacia el Campus/Terminal
  OUTBOUND = 'OUTBOUND', // SALIDA hacia Garita/Perimetral
}

export enum RouteServiceType {
  NORMAL = 'NORMAL',
  EXPRESS = 'EXPRESS',
  ALTERNATIVE = 'ALTERNATIVE',
}

export enum RouteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DETOUR = 'DETOUR',
}

export enum StopStatus {
  ACTIVE = 'ACTIVE',
  TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED',
  INACTIVE = 'INACTIVE',
}

export enum StopType {
  STANDARD = 'STANDARD',
  TERMINAL = 'TERMINAL',
  SHELTER = 'SHELTER',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_SERVICE = 'IN_SERVICE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  // Backward compatibility alias
  IDLE = 'AVAILABLE',
  ON_ROUTE = 'IN_SERVICE',
  OFFLINE = 'OUT_OF_SERVICE',
}

export type BusStatus = VehicleStatus;
export const BusStatus = VehicleStatus;

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PositionStatus {
  REAL_TIME_AVAILABLE = 'REAL_TIME_AVAILABLE',
  REAL_TIME_UNAVAILABLE = 'REAL_TIME_UNAVAILABLE',
  STALE = 'STALE',
}

export enum ServiceStatusType {
  NORMAL = 'NORMAL',
  DELAYED = 'DELAYED',
  ROUTE_MODIFIED = 'ROUTE_MODIFIED',
  STOP_CLOSED = 'STOP_CLOSED',
  SERVICE_SUSPENDED = 'SERVICE_SUSPENDED',
}

export enum AlertType {
  DELAY = 'DELAY',
  ROUTE_CHANGE = 'ROUTE_CHANGE',
  STOP_CLOSURE = 'STOP_CLOSURE',
  INTERRUPTION = 'INTERRUPTION',
  SERVICE_NOTICE = 'SERVICE_NOTICE',
  OTHER = 'OTHER',
}

export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentType {
  BREAKDOWN = 'BREAKDOWN',
  DELAY = 'DELAY',
  BLOCKED_STOP = 'BLOCKED_STOP',
  ACCIDENT = 'ACCIDENT',
  CONGESTION = 'CONGESTION',
  DETOUR = 'DETOUR',
  OTHER = 'OTHER',
}
