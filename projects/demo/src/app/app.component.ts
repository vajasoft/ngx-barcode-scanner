import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  hasZoom: any = {};
  zoom: number = 1;
  hasFocusDistance: any;
  focusDistance: number = 0;
  scanResult: any;
  hasTorch: boolean = false;
  torch: boolean = false;

  get Math() {
    return Math;
  }

  onResult(event: any) {
    console.log(`Focus distance changed: ${JSON.stringify(event)}`);
    this.scanResult = event;
  }

  onHasTorchChanged(event: any) {
    console.log(JSON.stringify(event));
    alert(JSON.stringify(event));
    this.hasTorch = event;
  }

  onHasZoomChanged(event: any) {
    console.log(JSON.stringify(event));
    this.hasZoom = event;
    if(this.hasZoom) {
      this.hasZoom.min;
    }
  }

  onHasFocusDistanceChanged(event: any) {
    console.log(`Focus distance changed: ${JSON.stringify(event)}`);
    this.hasFocusDistance = event;
  }

  onDecode(result: any) {
    console.log(result)
  }

}
