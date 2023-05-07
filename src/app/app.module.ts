import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ClarityModule } from '@clr/angular'
import { UserprofileComponent } from './component/userprofile/userprofile.component'
import { Nip07LoginComponent } from './component/nip07-login/nip07-login.component'

@NgModule({
  declarations: [
    AppComponent,
    UserprofileComponent,
    Nip07LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ClarityModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
