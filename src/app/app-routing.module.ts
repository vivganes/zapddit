import { NgModule } from '@angular/core';
import { RouterModule, type Routes } from '@angular/router';
import { EventFeedComponent } from './component/event-feed/event-feed.component';
import { SinglePostComponent } from './component/single-post/single-post.component';
import { PreferencesPageComponent } from './component/preferences-page/preferences-page.component';
import { PeopleIFollowComponent } from './component/peopleifollow/peopleifollow.component';
import { ProfileComponent } from './component/profile/profile.component';
import { CommunityListComponent } from './page/community-list/community-list.component';

const routes: Routes = [
  { path: 't/:topic', component: EventFeedComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'n/:noteid', component: SinglePostComponent },
  { path: '',   redirectTo: '/feed', pathMatch: 'full' }, // redirect to `first-component`
  { path: 'preferences', component: PreferencesPageComponent},
  { path: 'feed', component: EventFeedComponent },
  { path: 'communities/discover', component: CommunityListComponent },
  { path: 'communities/joined', component: CommunityListComponent },
  { path: 'communities/own', component: CommunityListComponent },
  { path: 'n/:communityName/:creatorHexKey', component: EventFeedComponent },
  { path: '**', component: EventFeedComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
