import { Component, OnInit, ViewChild, ElementRef, ViewContainerRef, Renderer2, Input } from '@angular/core';
import { WebGLRendererViewComponent } from '../web-gl-renderer-view/web-gl-renderer-view.component';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { WorldComponent } from '../world/world.component';
import { Vector3, PerspectiveCamera, OrthographicCamera, Mesh, Group, Object3D } from 'three';
import { OrbitControls } from 'three-orbitcontrols-ts';
import { IChunk } from '../../interfaces/i-chunk';
import { FirstPersonControls } from '../../classes/first-person-controls';
import * as Cannon from 'cannon';

@Component({
  selector: 'single-player-view',
  templateUrl: './single-player-view.component.html',
  styleUrls: ['./single-player-view.component.css'],
  host: {
  	'class': 'row w-100 h-100'
  }
})
export class SinglePlayerViewComponent extends WebGLRendererViewComponent {

	public world: WorldComponent;

	public havePointerLock: boolean = false;

	public controlsEnabled: boolean = false;

	public blocker: any;
	public instructions: any;

	@Input()
	seed: string = "0";

	public worldBounds: Vector3 = new Vector3(2, 1, 2);
	public chunkBounds: Vector3 = new Vector3(16, 64, 16);
	public voxelBounds: Vector3 = new Vector3(1, 0.25, 1);

	constructor(private storage: LocalStorage) { super(); }

	@ViewChild('container')
	container: ElementRef;

	ngOnInit() {
		super.ngOnInit();

		this.blocker = document.getElementById( 'blocker' );
		this.instructions = document.getElementById( 'instructions' );

		this.havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
		if (this.havePointerLock) {

			var element = document.body;

			var pointerlockchange = (event) => {
				if (document.pointerLockElement === element) {

					this.controls.enabled = true;

					this.blocker.style.display = 'none';

				} else {

					this.controls.enabled = false;

					this.blocker.style.display = '-webkit-box';
					this.blocker.style.display = '-moz-box';
					this.blocker.style.display = 'box';

					instructions.style.display = 'block';

				}

			};

			document.addEventListener( 'pointerlockchange', pointerlockchange.bind(this), false );
			document.addEventListener( 'mozpointerlockchange', pointerlockchange.bind(this), false );
			document.addEventListener( 'webkitpointerlockchange', pointerlockchange.bind(this), false );
		}

		this.onResize();
		this.container.nativeElement.appendChild(this.renderer.domElement);

		this.world = new WorldComponent(this.seed, this.chunkBounds, this.voxelBounds);
		this.world.onEntityUpdated.subscribe(this.updateEntity);
		this.world.scene = this.scene;
		this.world.playerCamera = this.camera;
		this.world.ngOnInit();

        let groundMaterial = new Cannon.Material("groundMaterial");
		this.world.cannon.addContactMaterial(new Cannon.ContactMaterial(groundMaterial, groundMaterial, {
            friction: 0.4,
            restitution: 0.3,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
            frictionEquationStiffness: 1e8
		}));
		
		var slipperyMaterial = new Cannon.Material("slipperyMaterial");
        // The ContactMaterial defines what happens when two materials meet.
        // In this case we want friction coefficient = 0.0 when the slippery material touches ground.
        var slippery_ground_cm = new Cannon.ContactMaterial(groundMaterial, slipperyMaterial, {
            friction: 0,
            restitution: 0.3,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        });
        this.world.cannon.addContactMaterial(slippery_ground_cm);

		let cameraPosition: Vector3 = new Vector3(this.chunkBounds.x * this.voxelBounds.x / 2, 64, this.chunkBounds.z * this.voxelBounds.z / 2);
		let s: Cannon.Sphere = new Cannon.Sphere(1);
		let b: Cannon.Body = new Cannon.Body({
			mass: 10,
			position: new Cannon.Vec3(cameraPosition.x, cameraPosition.y, cameraPosition.z),
			material: slipperyMaterial
		});
		b.addShape(s);
		b.addEventListener('change', (e) => {
			// this.camera.position.x = e.target.position.x;
			// this.playerCamera.position.y = e.target.position.y;
			// this.playerCamera.position.z = e.target.position.z;
			console.log("Cam Change:", e.target.velocity)
		});
		this.world.cannonMap.set([this.camera.uuid], b);
		this.world.cannon.addBody(b);

		this.controls = new FirstPersonControls(this.camera, b);
		// this.controls.lookSpeed = 0.1
		// this.controls.movementSpeed = 10
		// this.controls.activeLook = false;
		// this.controls = new OrbitControls(this.camera, PerspectiveCamera, OrthographicCamera, this.renderer.domElement);

		// this.camera.position.x = cameraPosition.x;
		// this.camera.position.y = cameraPosition.y;
		// this.camera.position.z = cameraPosition.z;
		// this.camera.lookAt(cameraPosition.x, 0, cameraPosition.z);

		this.scene.add(this.controls.getObject());

		for (var x = 0; x < this.worldBounds.x; x++){
			for (var z = 0; z < this.worldBounds.z; z++){
				let chunk: Group = this.world.generateChunk(new Vector3(x, 0, z));
				this.scene.add(chunk);
			}
		}
		

		var instructions = document.getElementById( 'instructions' );
		instructions.addEventListener( 'click', function ( event ) {

			instructions.style.display = 'none';

			// Ask the browser to lock the pointer
			element.requestPointerLock = element.requestPointerLock;
			element.requestPointerLock();

		}, false );

		// this.world.ngOnInit();
	}

	updateEntity(mesh: Mesh) {
		let e: Object3D[] = this.scene.children.filter(e => {
			return e.uuid == mesh.uuid;
		});
		if (e.length == 1) {
			let m: Mesh = <Mesh>e[0];
			this.scene.remove(m);
			this.scene.add(mesh);
		} else {
			this.scene.add(mesh);
		}
	}

	tick(timeSeconds: number, tickDeltaSeconds: number, currentFrame: number): void {
		if (this.controls && this.controls.enabled) {
			if (this && this.world)
				this.world.tick(tickDeltaSeconds);

			this.controls.update(tickDeltaSeconds);
			// let body = this.world.cannonMap.get([this.camera.uuid])
			// if (body)
			// 	body.position = new Cannon.Vec3(this.camera.position.x, this.camera.position.y, this.camera.position.z);
		}
		super.tick(timeSeconds, tickDeltaSeconds, currentFrame);
	};

	ngOnDestroy(): void {
		super.ngOnDestroy();
		if (this.world)
			this.world.ngOnDestroy();
	}

	onResize(): void {
		this.camera.aspect = this.container.nativeElement.clientWidth / this.container.nativeElement.clientHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.container.nativeElement.clientWidth, this.container.nativeElement.clientHeight);
	}

}
