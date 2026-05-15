import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { InspectionForm, PlaceData } from '../models/inspection.model';

@Component({
  selector: 'app-inspection-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection-form.component.html',
  styleUrls: ['./inspection-form.component.css']
})
export class InspectionFormComponent implements OnInit {
  @ViewChild('cameraInput') cameraInput!: ElementRef;
  @ViewChild('photoCanvas') photoCanvas!: ElementRef;

  currentUser: any;

  form: InspectionForm = {
    date: '', time: '', projectName: '', personName: '',
    assetName: '', remark: '', progress: 0, place: null
  };

  placeLoading = false;
  placeError = '';
  showPlaceModal = false;
  capturedPhoto: string | null = null;
  locationData: { lat: number; lng: number; accuracy: number } | null = null;
  addressResolved = '';
  mapUrl = '';

  showCamera = false;
  videoStream: MediaStream | null = null;
  cameraError = '';

  submitted = false;
  submitSuccess = false;
  isSubmitting = false;
  activeNav = 'form';

  private API_URL = 'http://127.0.0.1:5000/api/inspections';

  constructor(private auth: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.setCurrentDateTime();
    setInterval(() => this.setCurrentTime(), 60000);
  }

  setCurrentDateTime() {
    const now = new Date();
    this.form.date = now.toISOString().split('T')[0];
    this.setCurrentTime();
  }

  setCurrentTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.form.time = `${hh}:${mm}`;
  }

  goToHistory() { this.router.navigate(['/history']); }

  async capturePlace() {
    this.placeError = '';
    this.showPlaceModal = true;
    this.capturedPhoto = null;
    this.locationData = null;
    this.addressResolved = '';
    this.mapUrl = '';
    this.cameraError = '';
    this.placeLoading = true;
    try {
      const position = await this.getCurrentPosition();
      this.locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy)
      };
      this.mapUrl = `https://www.openstreetmap.org/?mlat=${this.locationData.lat}&mlon=${this.locationData.lng}#map=15/${this.locationData.lat}/${this.locationData.lng}`;
      this.addressResolved = await this.reverseGeocode(this.locationData.lat, this.locationData.lng);
      this.placeLoading = false;
      await this.startCamera();
    } catch (err: any) {
      this.placeLoading = false;
      this.placeError = err.message || 'Location access denied. Please enable GPS.';
    }
  }

  getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
      navigator.geolocation.getCurrentPosition(resolve, (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED: reject(new Error('GPS Permission denied.')); break;
          case error.POSITION_UNAVAILABLE: reject(new Error('Location unavailable.')); break;
          case error.TIMEOUT: reject(new Error('GPS Timeout.')); break;
          default: reject(new Error('Unknown GPS error'));
        }
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch { return `${lat.toFixed(6)}, ${lng.toFixed(6)}`; }
  }

  async startCamera() {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
      });
      this.showCamera = true;
      setTimeout(() => {
        const video = document.getElementById('liveCamera') as HTMLVideoElement;
        if (video && this.videoStream) { video.srcObject = this.videoStream; video.play(); }
      }, 100);
    } catch { this.cameraError = 'Camera access denied.'; }
  }

  takePicture() {
    const video = document.getElementById('liveCamera') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    if (this.locationData) {
      const oh = 100;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, canvas.height - oh, canvas.width, oh);
      ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 18px Arial';
      ctx.fillText('📍 GPS LOCATION', 16, canvas.height - oh + 24);
      ctx.fillStyle = 'white'; ctx.font = '14px Arial';
      ctx.fillText(`Lat: ${this.locationData.lat.toFixed(6)}  Lng: ${this.locationData.lng.toFixed(6)}`, 16, canvas.height - oh + 48);
      const addr = this.addressResolved.length > 70 ? this.addressResolved.substring(0, 70) + '...' : this.addressResolved;
      ctx.font = '12px Arial'; ctx.fillStyle = '#aaccff';
      ctx.fillText(addr, 16, canvas.height - oh + 70);
      ctx.fillStyle = '#ffb300';
      ctx.fillText(new Date().toLocaleString('en-IN'), 16, canvas.height - oh + 90);
    }
    this.capturedPhoto = canvas.toDataURL('image/jpeg', 0.85);
    this.stopCamera();
    this.showCamera = false;
  }

  retakePhoto() { this.capturedPhoto = null; this.startCamera(); this.showCamera = true; }

  stopCamera() {
    if (this.videoStream) { this.videoStream.getTracks().forEach(t => t.stop()); this.videoStream = null; }
  }

  confirmPlace() {
    if (!this.locationData) return;
    this.form.place = {
      latitude: this.locationData.lat, longitude: this.locationData.lng,
      accuracy: this.locationData.accuracy, address: this.addressResolved,
      photo: this.capturedPhoto, timestamp: new Date().toISOString()
    };
    this.showPlaceModal = false;
    this.stopCamera();
  }

  closePlaceModal() { this.showPlaceModal = false; this.stopCamera(); this.showCamera = false; }
  clearPlace() { this.form.place = null; this.capturedPhoto = null; }

  get progressColor(): string {
    if (this.form.progress < 25) return '#ff4444';
    if (this.form.progress < 50) return '#ffb300';
    if (this.form.progress < 75) return '#00b0ff';
    return '#00e676';
  }

  get progressLabel(): string {
    if (this.form.progress === 0) return 'Not Started';
    if (this.form.progress < 25) return 'Initial Stage';
    if (this.form.progress < 50) return 'In Progress';
    if (this.form.progress < 75) return 'Good Progress';
    if (this.form.progress < 100) return 'Almost Done';
    return 'Completed ✓';
  }

  // ========== SUBMIT — user_id include பண்றோம் ==========
  onSubmit() {
    this.submitted = true;
    if (!this.form.projectName || !this.form.assetName) return;

    this.isSubmitting = true;

    const payload = {
      user_id:         this.currentUser?.id,        // ✅ logged-in user id
      inspection_date: this.form.date,
      inspection_time: this.form.time + ':00',
      project_name:    this.form.projectName,
      person_name:     this.form.personName,
      asset_name:      this.form.assetName,
      remark:          this.form.remark || null,
      progress:        Number(this.form.progress),
      latitude:        this.form.place?.latitude || null,
      longitude:       this.form.place?.longitude || null,
      photo_base64:    this.form.place?.photo || null  // ✅ photo save
    };

    this.http.post(this.API_URL, payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        setTimeout(() => { this.submitSuccess = false; this.submitted = false; this.resetForm(); }, 3000);
      },
      error: (err) => {
        this.isSubmitting = false;
        alert('Submit failed! Backend running-ஆ check பண்ணுங்க.\nhttp://127.0.0.1:5000');
      }
    });
  }

  resetForm() {
    this.form = { date: '', time: '', projectName: '', personName: '', assetName: '', remark: '', progress: 0, place: null };
    this.capturedPhoto = null;
    this.submitted = false;
    this.setCurrentDateTime();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  logout() { this.auth.logout(); }

  openMapLink() {
    if (this.form.place) {
      window.open(`https://www.openstreetmap.org/?mlat=${this.form.place.latitude}&mlon=${this.form.place.longitude}#map=17/${this.form.place.latitude}/${this.form.place.longitude}`, '_blank');
    }
  }

  downloadPhoto() {
    if (this.form.place?.photo) {
      const a = document.createElement('a');
      a.href = this.form.place.photo;
      a.download = `inspection_${this.form.assetName}_${this.form.date}.jpg`;
      a.click();
    }
  }
}