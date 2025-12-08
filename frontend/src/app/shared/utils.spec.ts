import { ComponentFixture, TestBed } from '@angular/core/testing';
import { platformTypeEnumToString, stringToPlatformTypeEnum } from './utils';
import { PlatformTypeEnum } from '../../generated/platform';

describe('Utils.ts', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
    }).compileComponents();
  });

  it('stringToPlatformTypeEnum', () => {
    expect(stringToPlatformTypeEnum('GROUND')).toBe(PlatformTypeEnum.GROUND);
    expect(stringToPlatformTypeEnum('AIR')).toBe(PlatformTypeEnum.AIR);
    expect(stringToPlatformTypeEnum('MARITIME')).toBe(
      PlatformTypeEnum.MARITIME,
    );
    expect(stringToPlatformTypeEnum('T')).toBe(
      PlatformTypeEnum.UNKNOWN_PLATFORM,
    );
  });

  it('platformTypeEnum to string', () => {
    expect(platformTypeEnumToString(PlatformTypeEnum.GROUND)).toBe('GROUND');
    expect(platformTypeEnumToString(PlatformTypeEnum.AIR)).toBe('AIR');
    expect(platformTypeEnumToString(PlatformTypeEnum.MARITIME)).toBe(
      'MARITIME',
    );
    expect(platformTypeEnumToString(PlatformTypeEnum.UNKNOWN_PLATFORM)).toBe(
      'UNKNOWN',
    );
  });
});
