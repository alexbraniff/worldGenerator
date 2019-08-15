import { Input, OnInit, OnDestroy } from '@angular/core';

export abstract class ViewComponent implements OnInit, OnDestroy {

	@Input()
	title: string;

	constructor() {

	}

	ngOnInit() {

	}

	ngOnDestroy() {

	}

}
