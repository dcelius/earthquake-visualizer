/* Assignment 3: Earthquake Visualization
 * CSCI 4611, Spring 2023, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { Vector3 } from 'gophergfx';
import { EarthquakeRecord } from './EarthquakeRecord';

export class EarthquakeMarker extends gfx.MeshInstance
{
    private static baseMesh: gfx.Mesh;

    public baseScale : gfx.Vector3;
    public startTime : number;
    public duration : number;
    public magnitude : number;
    public mapPosition : gfx.Vector3;
    public globePosition : gfx.Vector3;
    public latitude : number;
    public longitude : number;

    constructor(mapPosition: gfx.Vector3, globePosition: gfx.Vector3, record: EarthquakeRecord, duration: number)
    {
        // If the static base mesh has not yet been created, then initialize it
        if(EarthquakeMarker.baseMesh == undefined)
        {
            // By default, the earthquake markers are instances of a sphere mesh.
            // You are free to leave them as spheres or come up with your own custom geometry.
            EarthquakeMarker.baseMesh = gfx.MeshFactory.createSphere(0.1, 2);
        }

        // Call the superclass constructor using the base mesh
        super(EarthquakeMarker.baseMesh);

        this.startTime = record.date.getTime();
        this.magnitude = record.normalizedMagnitude;
        this.duration = duration;
        this.mapPosition = mapPosition;
        this.globePosition = globePosition;
        this.baseScale = gfx.Vector3.ZERO;
        this.latitude = 0;
        this.longitude = 0;

        // Set the position to the plane by default
        this.position.copy(this.mapPosition);

        // Create a new material for this marker.
        this.material = new gfx.GouraudMaterial();
    }

    // This returns a number between 0 (start) and 1 (end)
    getPlaybackLife(currentTime: number) : number
    {
        return gfx.MathUtils.clamp(Math.abs(currentTime/1000 - this.startTime/1000) / this.duration, 0, 1);
    }

    positionFromAngle(degree: number) {
        const rad = Math.PI / 180;
        let tempLong = this.longitude + degree;
        if (tempLong > 180) tempLong -= 2 * 180; 
        const x = Math.cos(this.latitude * rad) * Math.sin(tempLong * rad);
        const y = Math.sin(this.latitude * rad);
        const z = Math.cos(this.latitude * rad) * Math.cos(tempLong * rad); 
        return new Vector3(x,y,z);
    }
}