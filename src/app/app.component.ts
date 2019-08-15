import { Component, OnInit } from '@angular/core';
import { BoxGeometry, Mesh, MeshNormalMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
	host: {
		'class': 'd-flex w-100 h-100'
	}
})
export class AppComponent implements OnInit {

	ngOnInit(): void {
		document.getElementsByTagName('html')[0].className = "d-flex w-100 h-100";
		document.getElementsByTagName('body')[0].className = "d-flex w-100 h-100";
	}

}
