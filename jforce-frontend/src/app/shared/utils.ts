import { Coordinate, format } from 'ol/coordinate';

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
