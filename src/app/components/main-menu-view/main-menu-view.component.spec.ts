import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainMenuViewComponent } from './main-menu-view.component';

describe('MainMenuViewComponent', () => {
  let component: MainMenuViewComponent;
  let fixture: ComponentFixture<MainMenuViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MainMenuViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainMenuViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
