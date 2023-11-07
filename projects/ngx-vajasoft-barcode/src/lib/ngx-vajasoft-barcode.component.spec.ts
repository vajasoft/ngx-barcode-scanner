import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxVajasoftBarcodeComponent } from './ngx-vajasoft-barcode.component';

describe('NgxVajasoftBarcodeComponent', () => {
  let component: NgxVajasoftBarcodeComponent;
  let fixture: ComponentFixture<NgxVajasoftBarcodeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NgxVajasoftBarcodeComponent]
    });
    fixture = TestBed.createComponent(NgxVajasoftBarcodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
