import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { GoogleMap } from '@angular/google-maps';

interface Coord {
  lat: number,
  lng: number
}

interface Marker {
  position: Coord
}

interface CoordResponse {
  status: string,
  locations: { _id: string, latitude: number, longitude: number }[]
}

interface UserResponse {
  status: string,
  users: { _id: string, user_email: string, user_name: string }[]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  @ViewChild(GoogleMap) map!: GoogleMap;
  @ViewChild('f') form!: NgForm;

  center!: google.maps.LatLngLiteral;
  zoom: number = 2;
  
  username: string = "";
  showLastCoordinates: boolean = false;
  showAllCoordinates: boolean = false;
  noData: boolean = false;

  lastLocation!: Marker;
  markers: Marker[] = [];

  selectedUserName: string = '';
  users: { _id: string, user_email: string, user_name: string }[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http
      .get<UserResponse>('http://127.0.0.1:3000/user/get-users')
      .subscribe(resData => {
        this.users = resData.users;
      });
  }

  onSubmit() {
    this.username = this.form.value.username;
    this.http
      .get<CoordResponse>('http://127.0.0.1:3000/coordinates/get-coordinates/user-name/' + this.username)
      .subscribe(resData => {
        console.log(resData.locations);
        this.noData = false;
        this.markers.splice(0, this.markers.length);
        for (const data of resData.locations) {
          this.markers.push({
            position: {lat: data.latitude, lng: data.longitude}
          });
        }
      });
  }

  onSelectedUserName(selectedUsername: string) {
    this.selectedUserName = selectedUsername;
    this.http
      .get<CoordResponse>('http://127.0.0.1:3000/coordinates/get-coordinates/user-name/' + this.selectedUserName)
      .subscribe(resData => {
        console.log(resData.locations);
        this.noData = false;
        this.markers.splice(0, this.markers.length);
        for (const data of resData.locations) {
          this.markers.push({
            position: {lat: data.latitude, lng: data.longitude}
          });
        }
      });
  }

  onShowLastLocation() {
    this.showLastCoordinates = true;
    if (this.markers.length > 0) {
      this.lastLocation = this.markers[this.markers.length - 1];
      this.center = this.lastLocation.position;
    } else {
      this.noData = true;
    }
  }

  onRemoveLastLocation() {
    this.showLastCoordinates = false;
  }

  onShowAllLocations() {
    this.showAllCoordinates = true;
    if (this.markers.length === 0) {
      this.noData = true;
    }
  }

  onRemoveAllLocations() {
    this.showAllCoordinates = false;
  }

  onClearMap() {
    this.showLastCoordinates = false;
    this.showAllCoordinates = false;
  }
}
