import {AfterViewInit, Component, ElementRef, effect, inject, OnDestroy, OnInit, signal, viewChild} from '@angular/core';
import {Starship} from '../../model/starship.model';
import {SwapiService} from '../../service/swapi.service';
import {TableModule} from 'primeng/table';

@Component({
  selector: 'app-starship',
  imports: [TableModule],
  templateUrl: './starship.component.html',
  styleUrl: './starship.component.css',
})
export class StarshipComponent implements OnInit, AfterViewInit, OnDestroy {
  public rows = signal<Starship[]>([]);
  private hasNext = signal(false);
  private isLoading = signal(false);
  private currentPage = signal(1);
  private errorMessage = signal<string | null>(null);
  private search = signal('');

  private scrollAnchor = viewChild<ElementRef>('scrollAnchor');

  private observer: IntersectionObserver | undefined;
  private currentObservedElement: Element | undefined;
  private hostRef = inject(ElementRef);
  private swapiService = inject(SwapiService);

  constructor() {
    // Re-attach the observer whenever the anchor element changes
    // (it moves to a new DOM node every time a new "last row" is rendered)
    effect(() => {
      const anchor = this.scrollAnchor();
      if (anchor && this.observer) {
        if (this.currentObservedElement) {
          this.observer.unobserve(this.currentObservedElement);
        }
        this.currentObservedElement = anchor.nativeElement;
        this.observer.observe(anchor.nativeElement);
      }
    });
  }

  ngOnInit() {
    this.loadPage();
  }

  ngAfterViewInit() {
    const scrollContainer = this.hostRef.nativeElement.querySelector('.p-datatable-table-container');

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.loadNextPage();
        }
      },
      {
        root: scrollContainer,
        threshold: 0.1
      }
    );

    const anchor = this.scrollAnchor();
    if (anchor) {
      this.currentObservedElement = anchor.nativeElement;
      this.observer.observe(anchor.nativeElement);
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  loadPage() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.swapiService.getPage(this.currentPage()).subscribe({
      next: (data) => {
        this.rows.update((existing) => [...existing, ...data.results]);
        this.hasNext.set(data.hasNext);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set("Failed to load");
        this.isLoading.set(false);
      }
    });
  }

  loadNextPage(): void {
    if (!this.hasNext() || this.isLoading()) {
      return;
    }
    this.currentPage.update((page) => page + 1);
    this.loadPage();
  }
}
