import { Coordinate, format } from 'ol/coordinate';
import { Waypoint } from './types';

export const MAP_PROJECTION = 'EPSG:4326';

export const toRadians = (degrees: number): number => degrees * (Math.PI / 180);
export const NMI_TO_KM = 1.852;
export const NMI_TO_M = 1852;
export const FOV_RANGE_KM = 2500 * NMI_TO_KM;
export const MAP_FACTOR = 0.7;
export const DEFAULT_ZOOM = 9;
export const MINS_PER_DAY = 86400;

export type RGB_TYPE = { r: number; b: number; g: number };

export const GREEN_COLORS = [
  [1, 50, 32],
  [1, 25, 16],
  [3, 74, 47],
  [3, 74, 12],
  [6, 148, 24],
  [24, 6, 148],
  [32, 8, 197],
  [8, 79, 197],
];

export const RED_COLORS = [
  [197, 32, 8],
  [148, 24, 6],
  [173, 28, 7],
  [173, 111, 7],
  [173, 14, 7],
  [173, 56, 7],
];

export function createWaypointId(
  platformName: string,
  waypoints: Waypoint[],
): string {
  let newIndex = waypoints.length ?? 0;
  let foundId = false;
  let newId = `${platformName}-waypoint-${newIndex}`;

  if (waypoints === undefined || waypoints.length == 0) {
    return newId;
  }

  while (!foundId) {
    newId = `${platformName}-waypoint-${newIndex}`;
    if (!waypoints.map((waypoint) => waypoint.id).includes(newId)) {
      foundId = true;
    } else {
      newIndex++;
    }
  }

  return newId;
}

export function createStringYX(fractionDigits: number) {
  return (
    /**
     * @param {Coordinate} coordinate Coordinate.
     * @return {string} String YX.
     */
    function (coordinate: Coordinate | undefined) {
      return format(coordinate!, '{x}, {y}', fractionDigits);
    }
  );
}

export function deepClone<T>(items: T[]): T[] {
  return items.map((item) => {
    if (Array.isArray(item)) {
      return deepClone(item); // Handle nested arrays
    } else if (typeof item === 'object' && item !== null) {
      // Correctly cloning each object property
      const clonedObject: any = {};
      for (const key in item) {
        clonedObject[key] = deepClone([item[key]])[0];
      }
      return clonedObject;
    }
    return item; // Return primitive types unchanged
  });
}

export function addHours(date: Date, hours: number) {
  const hoursToAdd = hours * 60 * 60 * 1000;
  date.setTime(date.getTime() + hoursToAdd);
  return date;
}

export function hexToRgb(hex: string): RGB_TYPE {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 225, g: 225, b: 225 };
}

function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

export function rgbToHex(rgb: RGB_TYPE) {
  return (
    '#' + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b)
  );
}
