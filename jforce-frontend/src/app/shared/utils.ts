import { Coordinate, format } from 'ol/coordinate';

export const toRadians = (degrees: number): number => degrees * (Math.PI / 180);
export const NMI_TO_KM = 1.852;
export const NMI_TO_M = 1852;
export const FOV_RANGE_KM = 2500 * NMI_TO_KM;
export const MAP_FACTOR = 0.7;
export const DEFAULT_ZOOM = 9;
export const MINS_PER_DAY = 86400;

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

export const PLATFORM_TRACK_COLORS = [
  [0, 0, 143],
  [182, 0, 0],
  [0, 140, 0],
  [236, 157, 0],
  [118, 255, 0],
  [89, 83, 84],
  [255, 117, 152],
  [148, 0, 115],
  [72, 83, 255],
  [166, 161, 154],
  [0, 67, 1],
  [138, 104, 0],
  [97, 0, 163],
  [92, 0, 17],
  [207, 193, 100],
  [0, 123, 105],
  [146, 184, 83],
  [126, 121, 163],
  [255, 84, 1],
  [168, 97, 92],
  [231, 0, 185],
  [255, 195, 166],
  [91, 53, 0],
  [0, 180, 133],
  [126, 158, 255],
  [231, 2, 92],
  [184, 216, 183],
  [192, 130, 183],
  [111, 137, 91],
  [138, 72, 162],
  [91, 50, 90],
  [220, 138, 103],
  [79, 92, 44],
  [0, 225, 115],
  [126, 193, 193],
  [120, 58, 61],
];
