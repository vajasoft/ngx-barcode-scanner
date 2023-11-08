import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxBarcodeScannerComponent } from './ngx-barcode-scanner.component';

describe('NgxBarcodeScannerComponent', () => {
  let component: NgxBarcodeScannerComponent;
  let fixture: ComponentFixture<NgxBarcodeScannerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NgxBarcodeScannerComponent]
    });
    fixture = TestBed.createComponent(NgxBarcodeScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
