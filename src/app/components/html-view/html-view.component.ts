import { OnInit } from '@angular/core';
import { ViewComponent } from '../view/view.component';

export abstract class HTMLViewComponent extends ViewComponent {

  constructor() { super(); }

  ngOnInit() {
  	super.ngOnInit();
  }

}
