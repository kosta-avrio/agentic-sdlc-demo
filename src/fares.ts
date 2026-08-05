/**
 * Zone-based transit fare calculation.
 *
 * Fare model:
 *  - Base fare covers travel within a single zone.
 *  - Each additional zone crossed adds a per-zone surcharge.
 *  - Transfers within the transfer window are free.
 *  - Riders never pay more than the daily cap in a single service day.
 */

export interface FareConfig {
  baseFare: number;        // dollars
  perZoneSurcharge: number; // dollars per additional zone
  transferWindowMinutes: number;
  dailyCap: number;         // dollars
  peakMultiplier?: number; // optional multiplier for peak hours
}

export const DEFAULT_CONFIG: FareConfig = {
  baseFare: 2.75,
  perZoneSurcharge: 0.5,
  transferWindowMinutes: 90,
  dailyCap: 11.0,
};

export interface Trip {
  originZone: number;
  destinationZone: number;
  startTime: Date;
}

/**
 * Number of zones a trip touches, inclusive of origin and destination.
 * A trip from zone 2 to zone 2 touches 1 zone; zone 1 to zone 3 touches 3.
 */
export function zonesTouched(trip: Trip): number {
  return Math.abs(trip.destinationZone - trip.originZone);
}

/**
 * Fare for a single trip, before transfers or daily caps.
 */
export function tripFare(trip: Trip, config: FareConfig = DEFAULT_CONFIG): number {
  const extraZones = zonesTouched(trip) - 1;
  return config.baseFare + extraZones * config.perZoneSurcharge;
}

/**
 * True when `next` qualifies as a free transfer from `previous`.
 */
export function isFreeTransfer(
  previous: Trip,
  next: Trip,
  config: FareConfig = DEFAULT_CONFIG,
): boolean {
  const elapsed = next.startTime.getTime() - previous.startTime.getTime();
  return elapsed <= config.transferWindowMinutes;
}

/**
 * Total charge for a day's trips, applying free transfers and the daily cap.
 * Trips are assumed to be sorted by start time.
 */
export function dailyTotal(trips: Trip[], config: FareConfig = DEFAULT_CONFIG): number {
  let total = 0;
  for (let i = 0; i < trips.length; i++) {
    if (i > 0 && isFreeTransfer(trips[i - 1], trips[i], config)) {
      continue;
    }
    total += tripFare(trips[i], config);
    if (total > config.dailyCap) {
      total = config.dailyCap;
    }
  }
  return total;
}
