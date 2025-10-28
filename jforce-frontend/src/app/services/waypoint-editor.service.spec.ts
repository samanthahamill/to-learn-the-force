import { TestBed } from '@angular/core/testing';

import { WaypointEditorService } from './waypoint-editor.service';

describe('WaypointEditorService', () => {
  let service: WaypointEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaypointEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
