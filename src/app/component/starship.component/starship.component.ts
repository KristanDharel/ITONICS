import {AfterViewInit, Component, computed, effect, ElementRef, inject, OnDestroy, OnInit, signal, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Starship} from '../../model/starship.model';
import {SwapiService} from '../../service/swapi.service';
import {TableModule} from 'primeng/table';

@Component({
  selector: 'app-starship',
  imports: [TableModule, FormsModule],
  templateUrl: './starship.component.html',
  styleUrl: './starship.component.scss',
})
export class StarshipComponent implements OnInit, AfterViewInit, OnDestroy {
  public rows = signal<Starship[]>([]);
  public hasNext = signal(false);
  public isLoading = signal(false);
  private currentPage = signal(1);
  public errorMessage = signal<string | null>(null);
  public search = signal('');

  // editable cell state
  public editingId = signal<number | null>(null);
  public editValue = signal('');

  // filtered view used by the table
  public filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.rows();
    }
    return this.rows().filter(s => s.name.toLowerCase().includes(term));
  });

  private scrollAnchor = viewChild<ElementRef>('scrollAnchor');

  private observer: IntersectionObserver | undefined;
  private currentObservedElement: Element | undefined;
  private hostRef = inject(ElementRef);
  private swapiService = inject(SwapiService);

  private isCancelling = false;

  constructor() {
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
      error: () => {
        this.errorMessage.set('Failed to load starships. Please try again.');
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

  retry(): void {
    this.loadPage();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  startEdit(starship: Starship) {
    this.editingId.set(starship.id);
    this.editValue.set(starship.name);
  }

  confirmEdit(id: number): void {
    if (this.isCancelling) {
      this.isCancelling = false;
      return;
    }
    const newValue = this.editValue().trim();
    if (newValue) {
      this.rows.update((existing) =>
        existing.map((s) => (s.id === id ? { ...s, name: newValue } : s))
      );
    }
    this.editingId.set(null);
  }

  cancelEdit(): void {
    this.isCancelling = true;
    this.editingId.set(null);
  }
}
