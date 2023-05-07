import { Component } from '@angular/core'
import '@cds/core/icon/register.js';
import { ClarityIcons, userIcon, boltIcon } from '@cds/core/icon';

ClarityIcons.addIcons(userIcon, boltIcon);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'zappedit'
}
