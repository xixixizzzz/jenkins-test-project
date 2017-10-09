import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GithubService } from './github/shared/github.service';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { RepoBrowserComponent } from './github/repo-browser/repo-browser.component';
import { RepoListComponent } from './github/repo-list/repo-list.component';
import { RepoDetailComponent } from './github/repo-detail/repo-detail.component';
import { ContactComponent } from './contact/contact.component';
import { RbacService } from './rbac/rbac.service';
import { TemplateComponent } from './form1/template.component';
import { ReactiveComponent } from './form2/reactive.component';

const rootRouterConfig: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent, outlet: 'test1' },
  { path: 'github', component: RepoBrowserComponent,
    children: [
      { path: '', component: RepoListComponent,
        children: [
          { path: '', component: RepoDetailComponent}
        ]
      }]
  },
  { path: 'form1', component: TemplateComponent },
  { path: 'form2', component: ReactiveComponent },
  { path: 'contact', component: ContactComponent, canActivate: [RbacService] }
];

@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    HomeComponent,
    RepoBrowserComponent,
    RepoListComponent,
    RepoDetailComponent,
    ContactComponent,
    TemplateComponent,
    ReactiveComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RouterModule.forRoot(rootRouterConfig, { useHash: true })
  ],
  providers: [
    GithubService,
    RbacService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
