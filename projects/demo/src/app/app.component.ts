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

  onResult(event: any) {
    console.log(JSON.stringify(event));
  }

  onHasZoomChanged(event: any) {
    console.log(JSON.stringify(event));
    this.hasZoom = event;
  }

  onHasFocusDistanceChanged(event: any) {
    console.log(`Focus distance changed: ${JSON.stringify(event)}`);
    this.hasFocusDistance = event;
  }

  onDecode(result: any) {
    console.log(result)
  }

  onZoomSliderChanged(event: any) {
    this.zoom = parseInt(event) ?? 1;
    console.log(`Zoom changed: ${JSON.stringify(this.zoom)}`);
  }

  onFocusDistanceSliderChanged(event: any) {
    this.focusDistance = parseInt(event) ?? 0;
    console.log(`Focus Distance changed: ${JSON.stringify(this.focusDistance)}`);
  }

}
