import { Component, OnInit } from '@angular/core';
import { HTMLViewComponent } from '../html-view/html-view.component';

@Component({
  selector: 'main-menu-view',
  templateUrl: './main-menu-view.component.html',
  styleUrls: ['./main-menu-view.component.css']
})
export class MainMenuViewComponent extends HTMLViewComponent implements OnInit {

  constructor() { super(); }

  ngOnInit() {
  	super.ngOnInit();
  }

}
