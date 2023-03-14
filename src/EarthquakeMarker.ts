/* Assignment 3: Earthquake Visualization
 * CSCI 4611, Spring 2023, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { EarthquakeRecord } from './EarthquakeRecord';

export class EarthquakeMarker extends gfx.MeshInstance
{
    private static baseMesh: gfx.Mesh;

    public startTime : number;
    public duration : number;
    public magnitude : number;
    public mapPosition : gfx.Vector3;
    public globePosition : gfx.Vector3;

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
}