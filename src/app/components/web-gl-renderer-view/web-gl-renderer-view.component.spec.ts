import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebGLRendererViewComponent } from './web-glrenderer-view.component';

describe('WebGLRendererViewComponent', () => {
  let component: WebGLRendererViewComponent;
  let fixture: ComponentFixture<WebGLRendererViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebGLRendererViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebGLRendererViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
