import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { BrowserMultiFormatReader, DecodeContinuouslyCallback, Exception } from '@zxing/library'

@Component({
  selector: 'ngx-barcode-scanner',
  templateUrl: './ngx-barcode-scanner.component.html',
  styleUrls: ['./ngx-barcode-scanner.component.scss']
})
export class NgxBarcodeScannerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scanner') scanner!: ElementRef;

  @Output() hasTorchChanged: EventEmitter<boolean> = new EventEmitter();
  @Output() hasZoomChanged: EventEmitter<boolean> = new EventEmitter();
  @Output() hasAutofocusChanged: EventEmitter<boolean> = new EventEmitter();
  @Output() hasFocusDistanceChanged: EventEmitter<boolean> = new EventEmitter();
  @Output() videoDevicesChanged: EventEmitter<boolean> = new EventEmitter();
  @Output() decoded: EventEmitter<string> = new EventEmitter();
  @Output() result: EventEmitter<any> = new EventEmitter();

  idealDevice: any = {};
  cameraDetails: any = {};
  videoDevices: any = {};
  isLoading: boolean = true;
  codeReader: BrowserMultiFormatReader = new BrowserMultiFormatReader();
  isMediaStreamAPISupported: boolean = false;

  private _torch: boolean = false;
  private _zoom: number = 1;
  private _autofocus: boolean = true;
  private _focusDistance: number = 0;
  private _landscape: boolean = false;
  private _deviceIndex: number = 0;
  private _noFrontCameras: boolean = false;
  private _height: string = '200px';

  @Input() 
  public get torch() {
    return this._torch;
  }
  public set torch(value: boolean) {
    this._torch = value;
    if (this.hasTorch()) {
      this.applyCameraConstraints()
    }
  }

  @Input()
  public get zoom() {
    return this._zoom;
  }
  public set zoom(value: number) {
    this._zoom = value;
    if (this.hasZoom()) {
      this.applyCameraConstraints()
    }
  }

  @Input() 
  public get autofocus() {
    return this._autofocus;
  }
  public set autofocus(value: boolean) {
    this._autofocus = value;
    if (this.hasAutofocus()) {
      this.applyCameraConstraints()
    }
  }

  @Input() 
  public get focusDistance() {
    return this._focusDistance;
  }
  public set focusDistance(value: number) {
    this._focusDistance = value;
    if (!this.autofocus) {
      this.applyCameraConstraints()
    }
  }

  @Input()
  public get landscape() {
    return this._landscape;
  }
  public set landscape(value: boolean) {
    this._landscape = value;
    if (this.landscape) {
      this.fullscreenLandscape()
    } else {
      this.exitFullscreenLandscape()
    }
  }

  @Input()
  public get deviceIndex() {
    return this._deviceIndex;
  }
  public set deviceIndex(value: number) {
    this._deviceIndex = value;
    if (this.deviceIndex != this.videoDevices.selectedIndex && this.deviceIndex == Number(this.deviceIndex) && this.videoDevices?.devices?.length > 1) {
      this.isLoading = true;
      this.codeReader.reset();
      this.cameraDetails = {};
      this.cameraDetails.previousDevice = this.idealDevice;
      const deviceId = this.videoDevices?.devices[this.deviceIndex]?.deviceId;
      navigator.mediaDevices.enumerateDevices().then(devices => {
        this.findIdealDevice(devices, deviceId).then(() => {
          this.selectCamera()
        })
      });
    }
  }

  @Input()
  public get noFrontCameras() {
    return this._noFrontCameras;
  }
  public set noFrontCameras(value: boolean) {
    this._noFrontCameras = value;
  }

  @Input() 
  public get height() {
    return this._height;
  }
  public set height(value: string) {
    this._height = value;
  }

  hasTorch() {
    return !!this.idealDevice?.torch
  }

  hasZoom() {
    return this.idealDevice?.zoom ? this.idealDevice.zoom : false
  }

  hasAutofocus() {
    return !!this.idealDevice?.focusMode?.includes('continuous')
  }

  hasFocusDistance() {
    return this.idealDevice?.focusDistance ? this.idealDevice.focusDistance : false
  }

  constructor() {
    this.isMediaStreamAPISupported = navigator && navigator.mediaDevices && 'enumerateDevices' in navigator.mediaDevices;
  }

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    if (!this.isMediaStreamAPISupported) {
      throw new Exception('Media Stream API is not supported')
      return
    }

    this.idealDevice = JSON.parse(localStorage.getItem('vue-barcode-reader-ideal') || '{}');
    this.cameraDetails.previousDevice = this.idealDevice;

    if (this.landscape) {
      this.fullscreenLandscape()
    }

    // If ideal device is already set, use it, if not, find the ideal device
    if (typeof this.idealDevice === 'object' && Object.keys(this.idealDevice).length > 0) {
      this.selectCamera()
    } else {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        this.findIdealDevice(devices).then(() => {
          this.selectCamera()
        })
      })
    }
  }

  ngOnDestroy(): void {
    this.isLoading = true
    this.codeReader.reset()
    if (this.landscape) {
      this.exitFullscreenLandscape()
    }
  }

  async findIdealDevice(devices: any[], deviceId = false) {
    let deviceOptions: any[] = [];
    let cameras: any[] = [];

    if (deviceId) {
      // Specific camera device specified, use this camera if it exists
      cameras = devices.filter((device) => device.kind === 'videoinput' && device.deviceId === deviceId)
    }

    if (cameras?.length !== 1) {
      // Filter for the ideal camera
      cameras = devices.filter((device) => device.kind === 'videoinput' && device.label.toLowerCase().indexOf('front') === -1);
      if (cameras?.length === 0) {
        cameras = devices.filter((device) => device.kind === 'videoinput');
      }
    }

    this.cameraDetails.requestedDeviceId = deviceId;
    this.cameraDetails.cameras = devices.filter(device => device.kind === 'videoinput');
    this.cameraDetails.filteredCameras = cameras;
    this.cameraDetails.constraints = [];
    for (let index = 0; index < cameras.length; index++) {
      const constraints: any = { video: true }
      if (deviceId) {
        constraints.video = {
          deviceId: {
            exact: cameras[index].deviceId,
          }
        }
      } else {
        constraints.video = { facingMode: 'environment' }
        if (cameras[index].deviceId) {
          constraints.video.deviceId = {
            exact: cameras[index].deviceId,
          }
        }
      }
      this.cameraDetails.constraints.push(constraints)
      await navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          const track = stream.getVideoTracks()[0]
          const trackCapabilities = {
            deviceId: cameras[index].deviceId,
            ...track.getCapabilities?.() ?? {}
          }
          deviceOptions.push(trackCapabilities)
          stream.getTracks().forEach(track => { track.stop() })
          return true
        })
        .catch(() => { return false })
    }

    this.cameraDetails.deviceOptions = deviceOptions

      if (deviceOptions.length > 0) {
        // If rear facing (environment) camera(s), use only those
        const environmentFacing = deviceOptions.filter(device => device.facingMode?.includes('environment'))
        if (environmentFacing.length > 0) {
          deviceOptions = environmentFacing
        }

        // Find ideal device (hopefully includes torch and continuous focus)
        let idealIndex = deviceOptions.length - 1
        for (let index = 0; index < deviceOptions.length; index++) {
          if (deviceOptions[index].torch && deviceOptions[index].focusMode.includes('continuous')) {
            idealIndex = index
            break
          } else if (deviceOptions[index].torch) {
            idealIndex = index
          }
        }

        this.idealDevice = deviceOptions[idealIndex]
        localStorage.setItem('vue-barcode-reader-ideal', JSON.stringify(deviceOptions[idealIndex]))
        return true
      } else {
        return false
      }
  }

  async fullscreenLandscape() {
    /* await document.documentElement.requestFullscreen()
      .then(() => {
        screen.orientation.lock('landscape').catch(() => {})
        return true
      })
      .catch(() => { return false }) */
  }

  async exitFullscreenLandscape() {
    /* screen.orientation.lock('portrait-primary').catch(() => {})
    await document.exitFullscreen()
      .then(() => { return true })
      .catch(() => { return false }) */
  }

  selectCamera() {
    // Make sure the ideal device we found is available with the code reader (if not, do a search)
    this.codeReader.listVideoInputDevices().then((videoInputDevices) => {
      if (this.noFrontCameras) {
        videoInputDevices = videoInputDevices.filter(device => device.label.toLowerCase().indexOf('front') === -1)
      }
      this.videoDevices = { devices: videoInputDevices }
      if (videoInputDevices.findIndex(device => device.deviceId === this.idealDevice.deviceId) === -1) {
        this.idealDevice = {}
        localStorage.removeItem('vue-barcode-reader-ideal')
        navigator.mediaDevices.enumerateDevices().then(devices => {
          this.findIdealDevice(devices).then(() => {
            this.selectCamera()
          })
        })
        return
      }

      // Now start the barcode reader
      this.startCodeReader(this.idealDevice.deviceId);
      this.scanner.nativeElement.oncanplay = (event: any) => {
        this.isLoading = false;
        this.videoDevices.selectedId = this.idealDevice.deviceId;
        this.videoDevices.selectedIndex = this.videoDevices?.devices?.findIndex((device: any) => device.deviceId === this.idealDevice.deviceId)
        this.cameraDetails.videoDevices = this.videoDevices.devices;
        this.cameraDetails.selectedIndex = this.videoDevices.selectedIndex;
        this.cameraDetails.selectedDeviceId = this.idealDevice.deviceId;
        this.cameraDetails.selectedDevice = this.idealDevice;

        this.hasTorchChanged.emit(this.hasTorch());
        this.hasZoomChanged.emit(this.hasZoom());
        this.hasAutofocusChanged.emit(this.hasAutofocus());
        this.hasFocusDistanceChanged.emit(this.hasFocusDistance());
        this.videoDevicesChanged.emit(this.videoDevices);

        this.applyCameraConstraints();
      };
    })
  }

  applyCameraConstraints() {
    const advanced: any = {};
    if (this.hasTorch()) advanced.torch = this.torch;
    if (this.hasZoom()) advanced.zoom = Math.min(Math.max(this.idealDevice.zoom.min, this.zoom), this.idealDevice.zoom.max)
    if (this.hasAutofocus() || (!this.hasAutofocus && !this.autofocus && this.hasFocusDistance())) advanced.focusMode = this.autofocus ? 'continuous' : 'manual'
    if (!this.autofocus && this.hasFocusDistance()) advanced.focusDistance = Math.min(Math.max(this.idealDevice.focusDistance.min, this.focusDistance), this.idealDevice.focusDistance.max)
    this.cameraDetails.applyConstraints = advanced
    //this.$emit('update:cameraDetails', this.cameraDetails)
    this.scanner?.nativeElement.srcObject?.getVideoTracks()[0]?.applyConstraints({
      advanced: [advanced]
    }).catch(() => {})
  }

  startCodeReader(deviceId: any) {
    this.codeReader.decodeFromVideoDevice(deviceId, this.scanner.nativeElement, (result, err) => {
      if (result) {
        console.log(result);
        this.decoded.emit(result.getText()); //this.$emit('decode', result.text)
        this.result.emit(result);//this.$emit('result', result)
      }
    });
  }
}
