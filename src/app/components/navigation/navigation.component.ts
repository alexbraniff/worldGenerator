import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  host: {
  	'class': 'row'
  }
})
export class NavigationComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
