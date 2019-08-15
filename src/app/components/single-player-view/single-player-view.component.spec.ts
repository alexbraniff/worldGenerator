import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SinglePlayerViewComponent } from './single-player-view.component';

describe('SinglePlayerViewComponent', () => {
  let component: SinglePlayerViewComponent;
  let fixture: ComponentFixture<SinglePlayerViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SinglePlayerViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SinglePlayerViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
