import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {StarshipComponent} from './component/starship.component/starship.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StarshipComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('StarWarsDataGrid');
}
