import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { LatLonSpherical } from 'geodesy';
import { area, difference } from '@turf/turf';
import { Polygon, MultiPolygon, polygon, Feature } from '@turf/helpers';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  inputControl: FormControl;
  title = 'geoTest';
  totalmeters = 100;
  inputMajorAxisMeters = 25;
  inputMinorAxisMeters = 25;

  totalArea = 0;
  orientation = 0;
  differenceArea: number|string = 0;
  smallArea = 0;
  ratio = 1;
  origin = [0, 0];
  bigShape: Feature<Polygon| MultiPolygon>;
  smallShape;
ngOnInit() {
  this.resetShape();
}
calcDifference() {
  const smallPoly = this.calcSearchPolygon(0, 0, this.inputMajorAxisMeters, this.inputMinorAxisMeters, this.orientation);
  const smallPolyPoints = smallPoly.map( (pos) => {
    return [pos.latitude, pos.longitude];
  });
  smallPolyPoints.push([smallPoly[0].latitude, smallPoly[0].longitude]);
  const smallshape = polygon([smallPolyPoints]);
  this.smallArea = area(smallshape);

  let diffShape = difference(this.bigShape, smallshape);
  diffShape = difference(this.bigShape, smallshape);
  if (diffShape) {
    this.differenceArea = area(diffShape);
    this.ratio = ( (this.totalArea - this.differenceArea) / this.totalArea);
    this.bigShape = diffShape;
  } else {
    this.differenceArea = 0;
    this.ratio = 1;

  }
}
resetShape() {
  const polygonPoints = this.calcSearchPolygon(0, 0, this.totalmeters, this.totalmeters, 0);
  const bigShapePoints = polygonPoints.map( (pos) => {
    return [pos.latitude, pos.longitude];
  });
  bigShapePoints.push([polygonPoints[0].latitude, polygonPoints[0].longitude]);
  this.bigShape = polygon([bigShapePoints]);
  this.totalArea = area(this.bigShape);
  this.smallArea = 0;
  this.differenceArea = this.totalArea;
  this.ratio = 0;
}

calcSearchPolygon(latitude: number, longitude: number, majorAxis: number, minorAxis: number, orientation: number){
  const orientationDeg = orientation * 180 / Math.PI;
  const semiMajor = majorAxis / 2;
  const semiMinor = minorAxis / 2;
  const cornerDistance = Math.sqrt(Math.pow(semiMajor, 2) + Math.pow(semiMinor, 2));
  const diffFactor = ((2 * cornerDistance) - semiMajor - semiMinor) / 3;
  const minDiffFactor = Math.min(cornerDistance - semiMajor, cornerDistance - semiMinor) / 3;
  const diffAvg = (diffFactor + minDiffFactor) / 2;
  const rotateDistance = semiMajor + diffAvg;
  const bRad = Math.atan((semiMinor) / (semiMajor));
  const bDeg = bRad * 180 / Math.PI;

  const centerLL = new LatLonSpherical(latitude, longitude);
  const polygonLL = new Array<LatLonSpherical>();
  polygonLL.push(centerLL.destinationPoint(semiMajor, orientationDeg)); // topLL
  polygonLL.push(centerLL.destinationPoint(cornerDistance, orientationDeg + bDeg)); // topRightLL
  polygonLL.push(centerLL.destinationPoint(semiMinor, orientationDeg + 90)); // RightLL
  polygonLL.push(centerLL.destinationPoint(cornerDistance, orientationDeg + 180 - bDeg)); // BottomRightLL
  polygonLL.push(centerLL.destinationPoint(semiMajor, orientationDeg + 180)); // BottomLL
  polygonLL.push(centerLL.destinationPoint(cornerDistance, orientationDeg + 180 + bDeg)); // BottomLeftLL
  polygonLL.push(centerLL.destinationPoint(semiMinor, orientationDeg - 90)); // LeftLL
  polygonLL.push(centerLL.destinationPoint(cornerDistance, orientationDeg - bDeg)); // TopLeftLL

  return polygonLL.map( pos => {
    return {latitude: pos.lat, longitude: pos.lon};
  });
}}
