import { NgModule } from '@angular/core'
import { RouterModule, type Routes } from '@angular/router'
import { EventFeedComponent } from './component/event-feed/event-feed.component'

const routes: Routes = [
  { path: 't/:topic', component: EventFeedComponent },
  { path: '**', component: EventFeedComponent }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
