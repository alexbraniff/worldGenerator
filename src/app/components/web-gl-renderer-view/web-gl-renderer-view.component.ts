import { OnInit } from '@angular/core';
import { BoxGeometry, Mesh, PerspectiveCamera, MeshNormalMaterial, Scene, WebGLRenderer, AmbientLight, Color, DirectionalLight, Vector3 } from 'three';
import { FirstPersonControls } from '../../classes/first-person-controls';
import { OrbitControls } from 'three-orbitcontrols-ts';
import { ViewComponent } from '../view/view.component';
import FrameTicker from 'frame-ticker';

export abstract class WebGLRendererViewComponent extends ViewComponent {

	camera: PerspectiveCamera;
	scene: Scene;
	renderer: WebGLRenderer;
	mesh: Mesh;
	controls: FirstPersonControls;

	protected maxFps: number = 60;
	protected minFps: number = 15;

	protected paused: boolean = true;

	protected ticker: FrameTicker;

	constructor() { super(); }

	ngOnInit(): void {
		super.ngOnInit();

		this.ticker = new FrameTicker(this.maxFps, this.minFps, this.paused);
		this.ticker.pause();
		this.ticker.onTick.add(this.tick.bind(this));

		this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10000);
		this.camera.position.y = 2.5;
		this.camera.lookAt(new Vector3(0, 0, 0));

		this.scene = new Scene();
		this.scene.background = new Color(0x00ccdd);

		this.scene.add(new AmbientLight(0x10));

		let directionalLight: DirectionalLight = new DirectionalLight(0xffffff);
		directionalLight.intensity = 0.25;
		directionalLight.position.x = 5;
		directionalLight.position.y = 5;
		directionalLight.position.z = 0;
		directionalLight.position.normalize();
		directionalLight.lookAt(0, 0, 0)
		this.scene.add(directionalLight);

		directionalLight = new DirectionalLight(0xffffff);
		directionalLight.intensity = 0.25;
		directionalLight.position.x = 5;
		directionalLight.position.y = -5;
		directionalLight.position.z = 0;
		directionalLight.position.normalize();
		directionalLight.lookAt(0, 0, 0)
		this.scene.add(directionalLight);

		directionalLight = new DirectionalLight(0xffffff);
		directionalLight.intensity = 0.25;
		directionalLight.position.x = 0;
		directionalLight.position.y = -5;
		directionalLight.position.z = 5;
		directionalLight.position.normalize();
		directionalLight.lookAt(0, 0, 0)
		this.scene.add(directionalLight);

		directionalLight = new DirectionalLight(0xffffff);
		directionalLight.intensity = 0.25;
		directionalLight.position.x = 0;
		directionalLight.position.y = -5;
		directionalLight.position.z = -5;
		directionalLight.position.normalize();
		directionalLight.lookAt(0, 0, 0)
		this.scene.add(directionalLight);

		// var directionalLight = new DirectionalLight( 0xffffff );
		// directionalLight.position.x = 0;
		// directionalLight.position.y = 5;
		// directionalLight.position.z = 5;
		// directionalLight.position.normalize();
		// directionalLight.lookAt(0, 0, 0)
		// this.scene.add( directionalLight );

		// var directionalLight = new DirectionalLight( 0xffffff );
		// directionalLight.position.x = -5;
		// directionalLight.position.y = 5;
		// directionalLight.position.z = 0;
		// directionalLight.position.normalize();
		// directionalLight.lookAt(0, 0, 0)
		// this.scene.add( directionalLight );

		// var directionalLight = new DirectionalLight( 0xffffff );
		// directionalLight.position.x = 0;
		// directionalLight.position.y = 5;
		// directionalLight.position.z = -5;
		// directionalLight.position.normalize();
		// directionalLight.lookAt(0, 0, 0)
		// this.scene.add( directionalLight );

		// let geometry: BoxGeometry = new BoxGeometry(0.4, 0.2, 0.2);
		// let material: MeshNormalMaterial = new MeshNormalMaterial();

		// this.mesh = new Mesh(geometry, material);
		// this.scene.add(this.mesh);

		this.renderer = new WebGLRenderer({ antialias: true })

		this.ticker.resume();
	}

	animate = () => {

		// requestAnimationFrame(this.animate.bind(this));

		// this.mesh.rotation.x += 0.01;
		// this.mesh.rotation.y += 0.02;

		this.renderer.render(this.scene, this.camera);
	};

	currentFrame: number;
	timeSeconds: number;

	tick(timeSeconds: number, tickDeltaSeconds: number, currentFrame: number): void {
		this.currentFrame = currentFrame;
		this.timeSeconds = timeSeconds;

		this.renderer.render(this.scene, this.camera);
	}

	ngOnDestroy(): void {
		super.ngOnDestroy();
	}
}
