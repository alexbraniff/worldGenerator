import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HTMLViewComponent } from './html-view.component';

describe('HTMLViewComponent', () => {
  let component: HTMLViewComponent;
  let fixture: ComponentFixture<HTMLViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HTMLViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HTMLViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
