import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

import { Marker } from './utils/marker';
import { CoordResponse } from './utils/coordResponse';
import { UserResponse } from './utils/userResponse';
import { GoogleMap } from '@angular/google-maps';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  // @ViewChild('map') map!: google.maps.Map;
  @ViewChild(GoogleMap) map!: GoogleMap;
  @ViewChild('f') form!: NgForm;
  
  center!: google.maps.LatLngLiteral;
  zoom: number = 2;

  username: string = "";
  showLastCoordinates: boolean = false;
  showAllCoordinates: boolean = false;
  showAllCoordinatesAfter: boolean = false;
  showDatePicker: boolean = false;
  showLiveUpdates: boolean = false;
  trackUser: boolean = false;
  
  noData: boolean = false;
  noAvailableData: boolean = false;
  noUsernameSelected: boolean = true;

  lastLocation!: Marker;
  markers: Marker[] = [];
  liveMarkers: Marker[] = [];
  geofenceMarkers: Marker[] = [];
  polylineOptions = {
    path:  [],
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2
  };

  polygonOptions = {
    paths: [],
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.5
  };  

  vertices: google.maps.LatLngLiteral[] = [
    {lat: 13, lng: 13},
    {lat: -13, lng: 0},
    {lat: 13, lng: -13},
  ];

  selectedUserName: string = '';
  users: { _id: string, user_email: string, user_name: string }[] = [];

  interval!: ReturnType<typeof setInterval>;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http
      .get<UserResponse>('http://127.0.0.1:3000/user/get-users')
      .subscribe(resData => {
        this.users = resData.users;
      });
  }

  onSelectedUserName(selectedUsername: string) {
    this.selectedUserName = selectedUsername;
    this.showAllCoordinates = false;
    this.showAllCoordinatesAfter = false;
    this.noUsernameSelected = false;
  }

  onShowLastLocation() {
    if (!this.selectedUserName) {
      alert('You must select an username first!');
    } else {
      this.http
      .get<CoordResponse>('http://127.0.0.1:3000/coordinates/get-last-coordinates/' + this.selectedUserName)
      .subscribe(resData => {
        if (resData.locations.length === 0) {
          this.noAvailableData = true;
          alert(`No available data for ${this.selectedUserName}`);
        } else {
          this.noAvailableData = false;
          this.lastLocation = {position: {lat: resData.locations[0].latitude, lng: resData.locations[0].longitude}};
          this.center = this.lastLocation.position;
          this.showLastCoordinates = true;
        }
      });
    }
  }

  onRemoveLastLocation() {
    this.showLastCoordinates = false;
  }

  onShowAllLocations() {
    if (!this.selectedUserName) {
      alert('You must select an username first!');
    } else {
      this.http
      .get<CoordResponse>('http://127.0.0.1:3000/coordinates/get-coordinates/user-name/' + this.selectedUserName)
      .subscribe(resData => {
        this.noData = false;
        this.markers.splice(0, this.markers.length);
        for (const data of resData.locations) {
          this.markers.push({
            position: {lat: data.latitude, lng: data.longitude}
          });
        }
        if (this.markers.length === 0) {
          this.noData = true;
        } else {
          const path: {lat: number, lng: number}[] = [];
          for (let i = 0; i < this.markers.length; i++) {
            path.push({
              lat: this.markers[i].position.lat,
              lng: this.markers[i].position.lng
            });
          }
          this.polylineOptions.path = path as never[];
        }
        this.showAllCoordinates = true;
      });
    }
  }

  onRemoveAllLocations() {
    this.showAllCoordinates = false;
  }

  onClearMap() {
    this.showLastCoordinates = false;
    this.showAllCoordinates = false;
    this.showDatePicker = false;
    this.showAllCoordinatesAfter = false;
    this.showLiveUpdates = false;
  }

  onShowCoordinatesAfterDate() {
    this.showDatePicker = true;
  }

  onSelectedDate(event: any) {
    console.log(event.target.value);
    this.showDatePicker = false;
    this.http
      .get<CoordResponse>('http://127.0.0.1:3000/coordinates/get-coordinates-after/' + this.selectedUserName + '/' + event.target.value)
      .subscribe(resData => {
        console.log(resData.locations);
        this.noData = false;
        this.markers.splice(0, this.markers.length);
        for (const data of resData.locations) {
          this.markers.push({
            position: {lat: data.latitude, lng: data.longitude}
          });
        }
        this.showAllCoordinatesAfter = true;
      });
  }


  onShowLiveUpdates() {
    this.showLastCoordinates = false;
    this.showAllCoordinates = false;
    this.liveMarkers.splice(0, this.liveMarkers.length);
    if (this.selectedUserName === '') {
      this.noUsernameSelected = true;
      alert('You must select an username first!');
    } else {
      this.interval = setInterval(() => {
        this.http
          .get<CoordResponse>('http://127.0.0.1:3000/coordinates/get-last-coordinates/' + this.selectedUserName)
          .subscribe(resData => {
            // console.log(resData);
            if (resData.locations.length === 0) {
              this.noAvailableData = true;
            } else {
              if (this.liveMarkers.length > 0 && this.liveMarkers[this.liveMarkers.length - 1] !== {position: {lat: resData.locations[0].latitude, lng: resData.locations[0].longitude}}) {
                this.liveMarkers.push({
                  position: {lat: resData.locations[0].latitude, lng: resData.locations[0].longitude}
                });
                if (this.trackUser) {
                  const path = [];
                  for (let i = 0; i < this.geofenceMarkers.length; i++) {
                    path.push({
                      lat: this.geofenceMarkers[i].position.lat,
                      lng: this.geofenceMarkers[i].position.lng
                    });
                  }
                  const polygon = new google.maps.Polygon({paths: path});
                  const result = google.maps.geometry.poly.containsLocation(new google.maps.LatLng(resData.locations[0].latitude, resData.locations[0].longitude), polygon);
                  console.log(result);
                }
              } else if (this,this.liveMarkers.length === 0) {
                this.liveMarkers.push({
                  position: {lat: resData.locations[0].latitude, lng: resData.locations[0].longitude}
                });
                if (this.trackUser) {
                  const path = [];
                  for (let i = 0; i < this.geofenceMarkers.length; i++) {
                    path.push({
                      lat: this.geofenceMarkers[i].position.lat,
                      lng: this.geofenceMarkers[i].position.lng
                    });
                  }
                  const polygon = new google.maps.Polygon({paths: path});
                  const result = google.maps.geometry.poly.containsLocation(new google.maps.LatLng(resData.locations[0].latitude, resData.locations[0].longitude), polygon);
                  console.log(result);
                }
              }
              this.showLiveUpdates = true;
            }
          });
      }, 1000);
    } 
  }

  onRemoveLiveUpdates() {
    this.showLiveUpdates = false;
    clearInterval(this.interval);
  }

  onSubmit(form: NgForm) {
    var interval = this.form.value.interval;
    var fastestInterval = this.form.value.fastest_interval;
    console.log(this.selectedUserName, interval, fastestInterval);
    this.http
      .post('http://127.0.0.1:3000/settings/send-settings', {user_name: this.selectedUserName, interval: interval, fastest_interval: fastestInterval})
      .subscribe(resData => console.log(resData));
    form.reset();
  }

  onChangedStartService(event: any) {
    console.log(event.currentTarget.checked);
    if (event.currentTarget.checked) {
      if (!this.selectedUserName) {
        alert('No username was selected. Please select one before starting the service!');
        event.currentTarget.checked = false;
      } else {
        this.http
          .post('http://127.0.0.1:3000/settings/start-service', {user_name: this.selectedUserName, start: 'start'})
          .subscribe(resData => console.log(resData));
      }
    } else {
      this.http
        .post('http://127.0.0.1:3000/settings/start-service', {user_name: this.selectedUserName, start: 'stop'})
        .subscribe(resData => console.log(resData));
    }
  }

  onMapClicked(event: google.maps.MapMouseEvent) {
    this.geofenceMarkers.push({
      position: {
        lat: event.latLng?.lat() as number,
        lng: event.latLng?.lng() as number
      }
    });
  }

  onStartTracking() {
    if (this.geofenceMarkers.length === 0) {
      alert('You must select at least 3 points on the map, then click again to start tracking');
    } else if (!this.showLiveUpdates){
      alert('You must enable live updates for the userm then click again to start tracking');
    } else {
      this.trackUser = true;
    }
  }

  onStopTracking() {
    this.trackUser = false;
  }
}
