import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Vector3, InstancedBufferGeometry, Face4, Face3, Mesh, MeshStandardMaterial, Color, DoubleSide, Group, MeshPhongMaterial, Texture, FrontSide, Vector2, Geometry, MeshBasicMaterial, BufferAttribute, Matrix4, Euler, Quaternion, InstancedBufferAttribute, BufferGeometry, Scene, Sphere, SphereGeometry, PerspectiveCamera, MultiMaterial } from 'three';
import { IChunk } from '../../interfaces/i-chunk';
import { IVoxel } from '../../interfaces/i-voxel';
import { VoxelFace } from '../../enums/voxel-face';
import FastSimplexNoise, { Options } from 'fast-simplex-noise';
import * as Cannon from 'cannon';

export class WorldComponent implements OnInit, OnDestroy {

	@Output()
	onEntityUpdated: EventEmitter<Mesh>;

	private noiseModule: FastSimplexNoise;
	public noiseModuleOptions: Options;
	private chunks: Map<Vector3, IChunk>;
	private heightMap: Map<Vector2, number>;
	private noiseMap: Map<Vector3, number>;
	public chunkGutter: number = 0;
	public cannon: Cannon.World;
	public playerCamera: PerspectiveCamera;
	public cannonMap: Map<string[], Cannon.Body>;
	private bodyPositions: Map<string[], Cannon.Vec3>;
	private meshPositions: Map<string[], Vector3>;
	private cannonNewPositionIntervals: Map<string[], number>;

	private movementThreshold: Vector3 = new Vector3(0.15, 0.15, 0.15);

	public scene: Scene;

	constructor(public seed: string, public chunkBounds: Vector3, public voxelBounds: Vector3) {
		this.onEntityUpdated = new EventEmitter<Mesh>();
	}

	ngOnInit() {
		console.log("# World ngOnInit");
		console.log(this.seed, this.chunkBounds, this.voxelBounds);

		this.cannon = new Cannon.World();
		this.cannon.broadphase = new Cannon.NaiveBroadphase();
		this.cannon.gravity.set(0, -9.8, 0);
		this.cannon.addEventListener("change", (e => {
			console.log("World Change:", e);
		}));

		this.cannonMap = new Map<string[], Cannon.Body>();
		this.bodyPositions = new Map<string[], Cannon.Vec3>();
		this.meshPositions = new Map<string[], Vector3>();
		this.cannonNewPositionIntervals = new Map<string[], number>();

		// this.chunkGutter = 1;

		this.noiseModuleOptions = <Options>{
			amplitude: 1,
			frequency: 1,
			max: 1,
			min: -1,
			octaves: 1,
			persistence: 0.5,
			random: Math.random
		};

		this.noiseModule = new FastSimplexNoise(this.noiseModuleOptions);
		this.chunks = new Map<Vector3, IChunk>();

		console.log("World ngOnInit #");
	}

	ngOnDestroy() {
		console.log("# World ngOnDestroy");
		console.log(this.seed, this.chunkBounds, this.voxelBounds);
		console.log("World ngOnDestroy #");
	}

	tick(delta: number) {
		this.cannon.step(delta);
		// this.cannonMap.forEach((body, key) => {
		// 	let obj: Mesh = <Mesh>this.scene.children.find(c => key.includes(c.uuid));
		// 	let bPos: Cannon.Vec3 = this.bodyPositions.get(key);
		// 	let mPos: Vector3 = this.meshPositions.get(key);
		// 	console.log(obj.position, body.position)
		// 	if (!bPos) {
		// 		this.bodyPositions.set(key, body.position);
		// 		bPos = body.position;
		// 	}
		// 	if (!mPos) {
		// 		this.meshPositions.set(key, obj.position);
		// 		mPos = obj.position;
		// 	}
		// 	if (body.position.x != bPos.x || body.position.y != bPos.y || body.position.z != bPos.z) {
		// 		this.bodyPositions.set(key, body.position)
		// 		obj.position.x = body.position.x;
		// 		obj.position.y = body.position.y;
		// 		obj.position.z = body.position.z;
		// 		this.meshPositions.set(key, obj.position)
		// 	} else if (obj.position.x != mPos.x || obj.position.y != mPos.y || obj.position.z != mPos.z) {
		// 		this.meshPositions.set(key, obj.position)
		// 		body.position.x = obj.position.x;
		// 		body.position.y = obj.position.y;
		// 		body.position.z = obj.position.z;
		// 		this.bodyPositions.set(key, body.position)
		// 	} else if (obj.position.x != body.position.x || obj.position.y != body.position.y || obj.position.z != body.position.z) {
		// 		obj.position.x = body.position.x;
		// 		obj.position.y = body.position.y;
		// 		obj.position.z = body.position.z;
		// 		this.meshPositions.set(key, obj.position)
		// 	}
		// 	console.log(obj.position, body.position)
		// })
	}

	getAbsoluteVoxelNoise(coords: Vector3) {
		return this.noiseModule.scaled3D(coords.x, coords.y, coords.z);
	}

	getChunkNoise(coords: Vector3) {
		return this.noiseModule.scaled3D(coords.x, coords.y, coords.z);
	}

	public getHeight(x: number, z: number) {
		x = x / 64;
		z = z / 64;
		return Math.trunc((this.noiseModule.scaled2D(x, z)
		+ (0.5 * this.noiseModule.scaled2D(2 * x, 2 * z))
		+ (0.25 * this.noiseModule.scaled2D(4 * x, 2 * z))).spread(-1, 1, 1, this.chunkBounds.y).clamp(1, this.chunkBounds.y))
	}

	generateChunk(coords: Vector3): Group {
		let x: number = coords.x;
		let y: number = coords.y;
		let z: number = coords.z;

		// this.noiseModuleOptions = <Options>{
		// 	amplitude: x * 2,
		// 	frequency: 2 / (x + 1),
		// 	max: 1,
		// 	min: -1,
		// 	octaves: x ,
		// 	persistence: x / 2,
		// 	random: Math.random
		// };

		// this.noiseModule = new FastSimplexNoise(this.noiseModuleOptions);

		let chunkNoise: number = this.getChunkNoise(coords);

		let voxelMap: Map<Vector3, IVoxel> = new Map<Vector3, IVoxel>();


		let chunkSize: Vector3 = new Vector3(this.chunkBounds.x * this.voxelBounds.x, this.chunkBounds.y * this.voxelBounds.y, this.chunkBounds.z * this.voxelBounds.z);

		let chunkMesh: Group = new Group();
		chunkMesh.position.x = chunkSize.x * coords.x + (coords.x * this.chunkGutter);
		chunkMesh.position.y = chunkSize.y * coords.y + (coords.y * this.chunkGutter);
		chunkMesh.position.z = chunkSize.z * coords.z + (coords.z * this.chunkGutter);

		let iGeometry: InstancedBufferGeometry = new InstancedBufferGeometry();
		let voxelGeometry: Geometry = new Geometry();
		let heights: number[] = [];
		let materials: MeshPhongMaterial[] = [];
		(async() => {
			for (var X = 0; X < this.chunkBounds.x; X++){
					for (var Z = 0; Z < this.chunkBounds.z; Z++){
							let absoluteCoords2D: Vector2 = new Vector2(this.chunkBounds.x * coords.x + X, this.chunkBounds.z * coords.z + Z);
							
							let height: number = this.getHeight(absoluteCoords2D.x, absoluteCoords2D.y);
							// console.log("Height:", height)
							heights.push(height);
							
							// let box: Cannon.Box = new Cannon.Box(new Cannon.Vec3(this.voxelBounds.x, height * this.voxelBounds.y, this.voxelBounds.z));
							// let body: Cannon.Body = new Cannon.Body(<Cannon.IBodyOptions>{
							// 	mass: 0
							// });
							// body.addShape(box);
							// body.position = new Cannon.Vec3(this.chunkBounds.x * coords.x * this.voxelBounds.x + (coords.x * this.chunkGutter) + (X * this.voxelBounds.x), 0, this.chunkBounds.z * coords.z * this.voxelBounds.z + (coords.z * this.chunkGutter) + (Z * this.voxelBounds.z))
							// this.cannon.addBody(body);

							for (var Y = 0; Y < height; Y++) {

								let voxelCoords: Vector3 = new Vector3(X, Y, Z);
								let absoluteCoords: Vector3 = new Vector3(absoluteCoords2D.x, Y, absoluteCoords2D.y);

								// let voxel: IVoxel = this.generateVoxel(voxelCoords, absoluteCoords);
								let voxelNoise: number = this.getAbsoluteVoxelNoise(new Vector3(absoluteCoords.x, Y, absoluteCoords.z));

								let vertices: Float32Array = new Float32Array(72);
								let normals: Float32Array = new Float32Array(216);

								let faceVisibility: Map<VoxelFace, boolean> = this.getVoxelFaceVisibility(voxelCoords);

								let a: number = height.spread(0, this.chunkBounds.y, 0, 1);
								let color: Color = new Color(a, a, a);

								materials.push(new MeshPhongMaterial({
									color: color,
									opacity: a,
									transparent: a < 1,
									alphaTest: 1
								}))

								let isVoxelVisible: boolean = false;

								// console.log("Absolute Coords:", absoluteCoords)
								Object.keys(VoxelFace).forEach((face: VoxelFace, i: number) => {
									let isVisible: boolean = false;
									switch (face) {
										case VoxelFace.Back:
											isVisible = this.getVoxelAlpha(new Vector3(absoluteCoords.x, absoluteCoords.y, absoluteCoords.z + 1)) < 1;
											break;
										case VoxelFace.Bottom:
											isVisible = this.getVoxelAlpha(new Vector3(absoluteCoords.x, absoluteCoords.y - 1, absoluteCoords.z)) < 1;
											break;
										case VoxelFace.Front:
											isVisible = this.getVoxelAlpha(new Vector3(absoluteCoords.x, absoluteCoords.y, absoluteCoords.z - 1)) < 1;
											break;
										case VoxelFace.Left:
											isVisible = this.getVoxelAlpha(new Vector3(absoluteCoords.x - 1, absoluteCoords.y, absoluteCoords.z)) < 1;
											break;
										case VoxelFace.Right:
											isVisible = this.getVoxelAlpha(new Vector3(absoluteCoords.x + 1, absoluteCoords.y, absoluteCoords.z)) < 1;
											break;
										case VoxelFace.Top:
											isVisible = this.getVoxelAlpha(new Vector3(absoluteCoords.x, absoluteCoords.y + 1, absoluteCoords.z)) < 1;
											break;
									}

									isVoxelVisible = isVoxelVisible ? isVoxelVisible : isVisible;

									if (isVisible) {
										let v1: Vector3;
										let v2: Vector3;
										let v3: Vector3;
										let v4: Vector3;

										let meshFace1: Face3;
										let meshFace2: Face3;

										let normal: Vector3 = new Vector3(0, 0, 0);

										let vertexStart: number = voxelGeometry.vertices.length;
										let a: any;
										
										meshFace1 = new Face3(vertexStart + 1, vertexStart, vertexStart + 2);
										meshFace1.color = color;
										meshFace2 = new Face3(vertexStart + 1, vertexStart + 3, vertexStart + 2);
										meshFace2.color = color;

										// let faceValue: number = face.valueOf();
										switch (face) {
											case VoxelFace.Back:
												v1 = new Vector3(X * this.voxelBounds.x, Y * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												v2 = new Vector3(X * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												v3 = new Vector3((X + 1) * this.voxelBounds.x, Y * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												v4 = new Vector3((X + 1) * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												normal.z = -1;
										
												a = meshFace2.a;
												meshFace2.a = meshFace2.c;
												meshFace2.c = a;
												break;
											case VoxelFace.Bottom:
												v1 = new Vector3(X * this.voxelBounds.x, Y * this.voxelBounds.y, Z * this.voxelBounds.z);
												v2 = new Vector3(X * this.voxelBounds.x, Y * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												v3 = new Vector3((X + 1) * this.voxelBounds.x, Y * this.voxelBounds.y, Z * this.voxelBounds.z);
												v4 = new Vector3((X + 1) * this.voxelBounds.x, Y * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												normal.y = -1;
										
												a = meshFace2.a;
												meshFace2.a = meshFace2.c;
												meshFace2.c = a;
												break;
											case VoxelFace.Front:
												v1 = new Vector3(X * this.voxelBounds.x, Y * this.voxelBounds.y, Z * this.voxelBounds.z);
												v2 = new Vector3(X * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, Z * this.voxelBounds.z);
												v3 = new Vector3((X + 1) * this.voxelBounds.x, Y * this.voxelBounds.y, Z * this.voxelBounds.z);
												v4 = new Vector3((X + 1) * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, Z * this.voxelBounds.z);
												normal.z = 1;
										
												a = meshFace1.a;
												meshFace1.a = meshFace1.c;
												meshFace1.c = a;
												break;
											case VoxelFace.Left:
												v1 = new Vector3(X * this.voxelBounds.x, Y * this.voxelBounds.y, Z * this.voxelBounds.z);
												v2 = new Vector3(X * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, Z * this.voxelBounds.z);
												v3 = new Vector3(X * this.voxelBounds.x, Y * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												v4 = new Vector3(X * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												normal.x = -1;
										
												a = meshFace2.a;
												meshFace2.a = meshFace2.c;
												meshFace2.c = a;
												break;
											case VoxelFace.Right:
												v1 = new Vector3((X + 1) * this.voxelBounds.x, Y * this.voxelBounds.y, Z * this.voxelBounds.z);
												v2 = new Vector3((X + 1) * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, Z * this.voxelBounds.z);
												v3 = new Vector3((X + 1) * this.voxelBounds.x, Y * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												v4 = new Vector3((X + 1) * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												normal.x = 1;
										
												a = meshFace1.a;
												meshFace1.a = meshFace1.c;
												meshFace1.c = a;
												break;
											case VoxelFace.Top:
												v1 = new Vector3(X * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, Z * this.voxelBounds.z);
												v2 = new Vector3(X * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												v3 = new Vector3((X + 1) * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, Z * this.voxelBounds.z);
												v4 = new Vector3((X + 1) * this.voxelBounds.x, (Y + 1) * this.voxelBounds.y, (Z + 1) * this.voxelBounds.z);
												normal.y = 1;
										
												a = meshFace1.a;
												meshFace1.a = meshFace1.c;
												meshFace1.c = a;
												break;
										}

										voxelGeometry.vertices.push(v1);
										voxelGeometry.vertices.push(v2);
										voxelGeometry.vertices.push(v3);
										voxelGeometry.vertices.push(v4);
										voxelGeometry.colors.push(color);
										voxelGeometry.colors.push(color);
										voxelGeometry.colors.push(color);
										voxelGeometry.colors.push(color);

										meshFace1.normal = normal;
										meshFace2.normal = normal;
										
										voxelGeometry.faces.push(meshFace1);
										voxelGeometry.faces.push(meshFace2);
										// chunkGeometry.faces.push(new Face4(vertexStart, vertexStart + 1, vertexStart + 2));
									}

									// voxelGeometry.computeFaceNormals();
									// voxelGeometry.computeVertexNormals();
				
									// let alpha: number = WorldComponent.getVoxelAlpha(voxelNoise);
								});

								voxelGeometry.mergeVertices();
							
								if (isVoxelVisible) {
									let box: Cannon.Box = new Cannon.Box(new Cannon.Vec3(this.voxelBounds.x, this.voxelBounds.y, this.voxelBounds.z));
									let body: Cannon.Body = new Cannon.Body(<Cannon.IBodyOptions>{
										mass: 0
									});
									body.addShape(box);
									body.position = new Cannon.Vec3(this.chunkBounds.x * coords.x * this.voxelBounds.x + (coords.x * this.chunkGutter) + (X * this.voxelBounds.x), this.chunkBounds.y * coords.y * this.voxelBounds.y + (coords.y * this.chunkGutter) + (Y * this.voxelBounds.y), this.chunkBounds.z * coords.z * this.voxelBounds.z + (coords.z * this.chunkGutter) + (Z * this.voxelBounds.z))
									this.cannon.addBody(body);
								}
							}
						// chunkMesh.add();
					}
			}
		})();

		// let heightField: Cannon.Heightfield = new Cannon.Heightfield(heights, {
		// 	elementSize: this.voxelBounds.x
		// });
		// let heightFieldBody: Cannon.Body = new Cannon.Body(<Cannon.IBodyOptions>{
		// 	mass: 1
		// });
		// heightFieldBody.addShape(heightField);
		// heightFieldBody.position = new Cannon.Vec3(this.chunkBounds.x * coords.x * this.voxelBounds.x + (coords.x * this.chunkGutter), this.chunkBounds.y * coords.y * this.voxelBounds.y + (coords.y * this.chunkGutter), this.chunkBounds.z * coords.z * this.voxelBounds.z + (coords.z * this.chunkGutter));
		// heightFieldBody.addEventListener("collide", (e: any) => {
		// 	console.log("HeightField collided:", e);
		// });

		// heightFieldBody.addEventListener('change', (e) => {
		// 	console.log("HeightField changed:", e);
		// })
		// this.cannon.addBody(heightFieldBody);
					
		let geo: InstancedBufferGeometry = <InstancedBufferGeometry>iGeometry.fromGeometry(voxelGeometry);
		geo.computeBoundingBox();
		geo.computeBoundingSphere();
		geo.computeVertexNormals();
		geo.boundingSphere.radius = 1000;

		// console.log("Geo", geo);
		let mesh: Mesh = new Mesh(voxelGeometry, new MeshStandardMaterial({color: 0x00ff00})/*materials*/);
		mesh.frustumCulled = false;
		mesh.position.x = this.chunkBounds.x * coords.x * this.voxelBounds.x + (coords.x * this.chunkGutter);
		mesh.position.y = this.chunkBounds.y * coords.y * this.voxelBounds.y + (coords.y * this.chunkGutter);
		mesh.position.z = this.chunkBounds.z * coords.z * this.voxelBounds.z + (coords.z * this.chunkGutter);
		this.scene.add(mesh);

		// let ball: Mesh = new Mesh(new SphereGeometry(1, 32, 32), new MeshBasicMaterial());
		// ball.position.x = this.chunkBounds.x * this.voxelBounds.x / 2 + this.chunkGutter;
		// ball.position.y = 36;
		// ball.position.z = this.chunkBounds.z * this.voxelBounds.z / 2 + this.chunkGutter;
		// this.scene.add(ball);
							
		// let cannonBall: Cannon.Sphere = new Cannon.Sphere(1);
		// let body: Cannon.Body = new Cannon.Body(<Cannon.IBodyOptions>{
		// 	mass: 1
		// });
		// body.addShape(cannonBall);
		// body.position = new Cannon.Vec3(ball.position.x, ball.position.y, ball.position.z);

		// body.addEventListener('change', (e) => {
		// 	this.cannonMap.forEach((body, key) => {
		// 		if (body.id == (<Cannon.Body>e.target).id) {
		// 			let mesh: Mesh = <Mesh>this.scene.children.find(c => key.includes(c.uuid));
		// 			if (this.cannonNewPositions.size > 0) {
		// 				let c = this.cannonNewPositions.get(key);
		// 				if (!c) {
		// 					this.cannonNewPositions.set(key, body.position);
		// 					this.cannonNewPositionIntervals.set(window.setInterval(() => {
		// 						if ()
		// 					}, 100));
		// 				} else if (Math.abs(c.x) - Math.abs(body.position.x) > this.movementThreshold.x || Math.abs(c.y) - Math.abs(body.position.y) > this.movementThreshold.y || Math.abs(c.z) - Math.abs(body.position.z) > this.movementThreshold.z) {
		// 					mesh.position.x = body.position.x;
		// 					mesh.position.y = body.position.y;
		// 					mesh.position.z = body.position.z;
		// 				}
		// 			}

		// 			// console.log(mesh.position, body.position)
		// 		}
		// 	})
		// })
		// this.cannonMap.set([ball.uuid], body);
		// this.cannon.addBody(body);

		// let chunk: IChunk = <IChunk>{
		// 	coords: coords,
		// 	bounds: this.chunkBounds,
		// 	// noise: chunkNoise,
		// 	// voxels: voxelMap,
		// 	meshGroup: chunkMesh
		// };

		return chunkMesh;
	}
	
	randomizeMatrix(matrix, coords) {
		let position: Vector3 = new Vector3();

		position.x = coords.x;
		position.y = coords.y;
		position.z = coords.z;
		
		let rotation: Euler = new Euler();

		rotation.x = 0;
		rotation.y = 0;
		rotation.z = 0;
		
		let quaternion: Quaternion = new Quaternion();

		quaternion.setFromEuler(rotation, false);

		let scale: Vector3 = new Vector3();

		scale.x = scale.y = scale.z = 1;

		matrix.compose(position, quaternion, scale);
	}

	generateVoxel(localCoords: Vector3, absoluteCoords: Vector3): IVoxel {
		let x: number = absoluteCoords.x;
		let y: number = absoluteCoords.y;
		let z: number = absoluteCoords.z;

		let voxelNoise: number = this.getAbsoluteVoxelNoise(absoluteCoords);

		let voxel: IVoxel = <IVoxel>{
			localCoords: localCoords,
			absoluteCoords: absoluteCoords,
			noise: voxelNoise,
			faceVisibility: this.getVoxelFaceVisibility(absoluteCoords)
		};

		return voxel;
	}

	public getVoxelFaceVisibility(coords: Vector3): Map<VoxelFace, boolean> {
		let x: number = coords.x;
		let y: number = coords.y;
		let z: number = coords.z;

		let xOriginal: number = coords.x;
		let yOriginal: number = coords.y;
		let zOriginal: number = coords.z;

		let faceVisibility: Map<VoxelFace, boolean> = new Map<VoxelFace, boolean>();

		Object.keys(VoxelFace).forEach(key => {
			let face: VoxelFace = VoxelFace[key];

			switch (face) {
				case VoxelFace.Back:
					z--;
					break;
				case VoxelFace.Bottom:
					y--;
					break;
				case VoxelFace.Front:
					z++;
					break;
				case VoxelFace.Left:
					x--;
					break;
				case VoxelFace.Right:
					x++;
					break;
				case VoxelFace.Top:
					y++;
					break;
			}

			faceVisibility.set(face, this.getVoxelAlpha(coords) < 1);
			console.log

			x = xOriginal;
			y = yOriginal;
			z = zOriginal;
		});

		return faceVisibility;
	}

	public getVoxelAlpha(coords: Vector3): number {
		return coords.y <= 0 ? 1 : coords.y >= this.getHeight(coords.x, coords.z) ? 0 : 1;
		// return noise.spread(-1, 1, -0.25, 1.25).clamp(0, 1) < 0.5 ? 0 : 1;
	}

	public static getVoxelRed(noise: number): number {
		return noise.spread(-1, 1, 0, 1);
	}

	public static getVoxelGreen(noise: number): number {
		return noise.spread(-1, 1, 0, 1);
	}

	public static getVoxelBlue(noise: number): number {
		return noise.spread(-1, 1, 0, 1);
	}

}
