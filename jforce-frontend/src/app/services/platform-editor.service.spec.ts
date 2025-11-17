import { TestBed } from '@angular/core/testing';

import { PlatformEditorService } from './platform-editor.service';

describe('PlatformEditorService', () => {
  let service: PlatformEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlatformEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
