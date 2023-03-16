/* Assignment 3: Earthquake Visualization
 * CSCI 4611, Spring 2023, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { Quaternion, Vector3 } from 'gophergfx';
import { EarthquakeMarker } from './EarthquakeMarker';
import { EarthquakeRecord } from './EarthquakeRecord';

export class Earth extends gfx.Transform3
{
    private earthMesh: gfx.MorphMesh;

    public globeMode: boolean;

    public elapsed_time: number;

    public paused: boolean;

    public axis: Quaternion;

    public degRot : number;

    constructor()
    {
        // Call the superclass constructor
        super();

        this.earthMesh = new gfx.MorphMesh();

        this.globeMode = false;

        this.elapsed_time = 0;

        this.paused = false;

        this.axis = new Quaternion(0, 0.25, -0.25, 1);
        this.axis.normalize();

        this.degRot = 0;
    }

    public createMesh() : void
    {
        // Initialize texture: you can change to a lower-res texture here if needed
        // Note that this won't display properly until you assign texture coordinates to the mesh
        this.earthMesh.material.texture = new gfx.Texture('./assets/earth-2k.png');
        
        // This disables mipmapping, which makes the texture appear sharper
        this.earthMesh.material.texture.setMinFilter(true, false);   

        // You can use this variable to define the resolution of your flat map and globe map
        // using a nested loop. 20x20 is reasonable for a good looking sphere, and you don't
        // need to change this constant to complete the base assignment  However,if you want 
        // to use height map or bathymetry data for a wizard bonus, you might need to increase
        // the mesh resolution to get better results.
        const meshResolution = 20;
        
        // Precalculated vertices and normals for the earth plane mesh.
        // After we compute them, we can store them directly in the earthMesh,
        // so they don't need to be member variables.
        const mapVertices: gfx.Vector3[] = [];
        const mapNormals: gfx.Vector3[] = [];
        const indices: number[] = [];
        const texCoords: number[] = [];
        // Part 1: Creating the Flat Map Mesh
        // As a demo, we'll add an rectangle with two triangles.
        // First, we define four vertices at each corner of the earth
        // in latitude and longitude and convert to the coordinates
        // used for the flat map.
        const vertexRes = meshResolution + 1
        const xoffset = 360 / meshResolution;
        const yoffset = 180 / meshResolution;
        for (let i = 0; i < vertexRes; i++) {
            for (let j = 0; j < vertexRes; j++) {
                mapVertices.push(this.convertLatLongToPlane(-90 + yoffset * i, -180 + xoffset * j)); 
                // The flat map normals are always directly outward towards the camera   
                mapNormals.push(gfx.Vector3.BACK);
                // Part 2: Texturing the Mesh
                texCoords.push((j / meshResolution), 1 - (i / meshResolution));
                // Define indices into the array for the two triangles
                if (i < meshResolution && j < meshResolution) {
                    //console.log(i + " " + j);
                    for (let k = 0; k < 2; k++) {
                        if (k==0) indices.push((i+1) * vertexRes + j, i * vertexRes + j, i * vertexRes + (j+1));
                        else indices.push(i * vertexRes + (j+1), (i+1) * vertexRes + (j+1), (i+1) * vertexRes + j);
                    }
                }
            }
        }
        // Set all the earth mesh data
        this.earthMesh.setVertices(mapVertices, true);
        this.earthMesh.setNormals(mapNormals, true);
        this.earthMesh.setIndices(indices);
        this.earthMesh.setTextureCoordinates(texCoords);
        this.earthMesh.createDefaultVertexColors();

        // Part 3: Creating the Globe Mesh
        // You should compute a new set of vertices and normals
        // for the globe. You will need to also add code in
        // the convertLatLongToSphere() method below.
        const globeVertices: gfx.Vector3[] = [];
        const globeNormals: gfx.Vector3[] = [];
        for (let i = 0; i < vertexRes; i++) {
            for (let j = 0; j < vertexRes; j++) {
                const vec = this.convertLatLongToSphere(-90 + yoffset * i, -180 + xoffset * j);
                globeVertices.push(vec); 
                const vecdir = vec.clone();
                vecdir.normalize();
                globeNormals.push(vecdir);
            }
        }
        this.earthMesh.setMorphTargetVertices(globeVertices);
        this.earthMesh.setMorphTargetNormals(globeNormals);
        // Add the mesh to this group
        this.add(this.earthMesh);
    }

    public update(deltaTime: number) : void
    {
        // Part 4: Morphing Between the Map and Globe
        // The value of this.globeMode will be changed whenever
        // the user selects flat map or globe mode in the GUI.
        // You should use this boolean to control the morphing
        // of the earth mesh, as described in the readme.
        if (this.globeMode){
            if (this.earthMesh.morphAlpha <= 0) {
                this.elapsed_time = 0;
                this.degRot = 0
            }
            if (this.earthMesh.morphAlpha < 1) {
                this.elapsed_time += deltaTime;
                this.earthMesh.morphAlpha = gfx.MathUtils.lerp(0, 1, this.elapsed_time);
                const newRotVec = gfx.Quaternion.slerp(Quaternion.IDENTITY, this.axis, this.elapsed_time);
                this.earthMesh.rotation = newRotVec;
            }
            else 
            {   
                this.degRot = (this.degRot + (deltaTime * 180 / Math.PI) / 4) % 360;
                console.log(this.degRot);
                this.earthMesh.rotateY(deltaTime / 4);
            }
        }
        else {
            if (this.earthMesh.morphAlpha >= 1) this.elapsed_time = 0;
            if (this.earthMesh.morphAlpha > 0) {
                this.elapsed_time += deltaTime;
                this.earthMesh.morphAlpha = 1 - gfx.MathUtils.lerp(0, 1, this.elapsed_time);
                const newRotVec = gfx.Quaternion.slerp(this.earthMesh.rotation, Quaternion.IDENTITY, this.elapsed_time);
                this.earthMesh.rotation = newRotVec;
            }
        }
    }

    public createEarthquake(record: EarthquakeRecord)
    {
        // Number of milliseconds in 1 year (approx.)
        const duration = 12 * 28 * 24 * 60 * 60;

        // Part 5: Creating the Earthquake Markers
        // Currently, the earthquake is just placed randomly
        // on the plane. You will need to update this code to
        // correctly calculate both the map and globe positions.
        const mapPosition = this.convertLatLongToPlane(record.latitude, record.longitude);
        const globePosition = this.convertLatLongToSphere(record.latitude, record.longitude);

        const earthquake = new EarthquakeMarker(mapPosition, globePosition, record, duration);

        // Global adjustment to reduce the size. You should probably
        // update this be a more meaningful representation..
        earthquake.scale = gfx.Vector3.lerp(new Vector3(0.05, 0.05, 0.05), new Vector3(1, 1, 1), earthquake.magnitude);
        earthquake.baseScale = earthquake.scale;
        earthquake.material.setColor(gfx.Color.lerp(gfx.Color.YELLOW, gfx.Color.RED, earthquake.magnitude));
        earthquake.latitude = record.latitude;
        earthquake.longitude = record.longitude;

        // Uncomment this line of code to active the earthquake markers
        this.add(earthquake);
    }

    public animateEarthquakes(currentTime : number)
    {
        // This code removes earthquake markers after their life has expired
        this.children.forEach((quake: gfx.Transform3) => {
            if(quake instanceof EarthquakeMarker)
            {
                const playbackLife = (quake as EarthquakeMarker).getPlaybackLife(currentTime);

                // The earthquake has exceeded its lifespan and should be moved from the scene
                if(playbackLife >= 1)
                {
                    quake.remove();
                }
                // The earthquake positions should be updated
                else
                {
                    // Part 6: Morphing the Earthquake Positions
                    // If you have correctly computed the flat map and globe positions
                    // for each earthquake marker in part 5, then you can simply lerp
                    // between them using the same alpha as the earth mesh
                    
                    if (this.globeMode) {
                        if (this.earthMesh.morphAlpha < 1) 
                        {
                            quake.position = gfx.Vector3.lerp(quake.mapPosition, quake.globePosition, this.earthMesh.morphAlpha);
                            quake.position.rotate(this.earthMesh.rotation);
                        }
                        else {
                            quake.position = quake.positionFromAngle(this.degRot);
                            quake.position.rotate(this.axis);
                        }
                    }
                    else {
                        quake.position = gfx.Vector3.lerp(quake.globePosition, quake.mapPosition, 1 - this.earthMesh.morphAlpha);
                    }
                    quake.scale = gfx.Vector3.lerp(quake.baseScale, gfx.Vector3.ZERO, playbackLife);
                }
            }
        });
    }

    // This convenience method converts from latitude and longitude (in degrees) to a Vector3 object
    // in the flat map coordinate system described in the readme.
    public convertLatLongToPlane(latitude: number, longitude: number): gfx.Vector3
    {
        return new gfx.Vector3(longitude * Math.PI / 180, latitude * Math.PI / 180, 0);
    }

    // This convenience method converts from latitude and longitude (in degrees) to a Vector3 object
    // in the globe mesh map coordinate system described in the readme.
    public convertLatLongToSphere(latitude: number, longitude: number): gfx.Vector3
    {
        // Part 3: Creating the Globe Mesh
        // Add code here to correctly compute the 3D sphere position
        // based on latitude and longitude.
        const rad = Math.PI / 180;
        const x = Math.cos(latitude * rad) * Math.sin(longitude * rad);
        const y = Math.sin(latitude * rad);
        const z = Math.cos(latitude * rad) * Math.cos(longitude * rad); 
        return new gfx.Vector3(x, y, z);
    }

    // This function toggles the wireframe debug mode on and off
    public toggleDebugMode(debugMode : boolean)
    {
        this.earthMesh.material.wireframe = debugMode;
    }

    public togglePause(pauseState : boolean) 
    {
        this.paused = pauseState;
    }
}