import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';

import { AppComponent } from './app.component';

import { NavigationComponent } from './components/navigation/navigation.component';

import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';

import { MainMenuViewComponent } from './components/main-menu-view/main-menu-view.component';
import { SinglePlayerViewComponent } from './components/single-player-view/single-player-view.component';

import * as Cannon from 'cannon';

const appRoutes: Routes = [
  {
    path: 'menu',
    component: MainMenuViewComponent,
    data: { title: 'Main Menu' }
  },
  {
    path: 'singleplayer',
    component: SinglePlayerViewComponent,
    data: { title: 'Single Player' }
  },
  {
    path: 'multiplayer',
    redirectTo: '/menu',
    pathMatch: 'full'
    // data: { title: 'Heroes List' }
  },
  { path: '',
    redirectTo: '/menu',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];

declare global {
  interface Number {
    spread(aStart: number, aEnd: number, bStart: number, bEnd: number): number
    clamp(min: number, max: number): number
  }
}

Number.prototype.spread = function(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return (this - aStart) / (aEnd - aStart) * (bEnd - bStart) + bStart;
};
Number.prototype.clamp = function(min: number, max: number) {
  return Math.min(Math.max(this, min), max);
}

Number.prototype.spread = function(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  return (this - aStart) / (aEnd - aStart) * (bEnd - bStart) + bStart;
};
Number.prototype.clamp = function(min: number, max: number) {
  return Math.min(Math.max(this, min), max);
}

@NgModule({
  declarations: [
    AppComponent,
    MainMenuViewComponent,
    SinglePlayerViewComponent,
    NavigationComponent,
    PageNotFoundComponent
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    ),
    BrowserModule,
    BsDropdownModule.forRoot(),
    TooltipModule.forRoot(),
    ModalModule.forRoot()
  ],
  providers: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
