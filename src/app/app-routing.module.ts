import { NgModule } from '@angular/core';
import { RouteReuseStrategy, RouterModule, provideRouter, type Routes, withInMemoryScrolling, withDebugTracing } from '@angular/router';
import { EventFeedComponent } from './component/event-feed/event-feed.component';
import { SinglePostComponent } from './component/single-post/single-post.component';
import { PreferencesPageComponent } from './component/preferences-page/preferences-page.component';
import { PeopleIFollowComponent } from './component/peopleifollow/peopleifollow.component';
import { ProfileComponent } from './component/profile/profile.component';
import { CommunityListComponent } from './page/community-list/community-list.component';
import { LoginPageComponent } from './page/login-page/login-page.component';
import { ZapdditRouteReuseStrategy } from './util/ZapdditRouteReuseStrategy';
import { HomeFeedComponent } from './component/event-feed/home-feed.component';

const routes: Routes = [
  { path: 't/:topic', component: EventFeedComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'n/:noteid', component: SinglePostComponent },
  { path: '',   redirectTo: '/feed', pathMatch: 'full' }, // redirect to `first-component`
  { path: 'preferences', component: PreferencesPageComponent},
  { path: 'feed', component: HomeFeedComponent, data:{ reuseComponent:true} },
  { path: 'communities/discover', component: CommunityListComponent },
  { path: 'communities/joined', component: CommunityListComponent },
  { path: 'communities/own', component: CommunityListComponent },
  { path: 'communities/moderating', component: CommunityListComponent },
  { path: 'communities/recently-active', component: CommunityListComponent },
  { path: 'n/:communityName/:creatorHexKey', component: EventFeedComponent },
  { path: '**', component: EventFeedComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule],
  providers:[{provide:RouteReuseStrategy, useClass:ZapdditRouteReuseStrategy}]
})
export class AppRoutingModule {}
