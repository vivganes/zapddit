import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { EventFeedComponent } from './component/event-feed/event-feed.component';
import { SinglePostComponent } from './component/single-post/single-post.component';

const routes: Routes = [
  { path: 't/:topic', component: EventFeedComponent },
  { path: 'n/:eventid', component: SinglePostComponent },
  { path: '**', component: EventFeedComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
