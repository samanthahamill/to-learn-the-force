import { ComponentFixture, TestBed } from '@angular/core/testing';
import { stringToPlatformTypeEnum } from './utils';
import { PlatformTypeEnum } from '../../generated/platform';

describe('Utils.ts', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
    }).compileComponents();
  });

  it('stringToPlatformTypeEnum', () => {
    expect(stringToPlatformTypeEnum('GROUND')).toBe(PlatformTypeEnum.GROUND);
  });

  it('platformTypeEnum to string', () => {
    expect(PlatformTypeEnum.GROUND).toBe(stringToPlatformTypeEnum('GROUND'));
  });
});
