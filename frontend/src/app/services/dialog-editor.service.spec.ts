import { TestBed } from '@angular/core/testing';

import { DialogEditorService } from './dialog-editor.service';

describe('DialogEditorService', () => {
  let service: DialogEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DialogEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
