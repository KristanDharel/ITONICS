import '../../test-util/intersection-observer-mock';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StarshipComponent } from './starship.component';
import { SwapiService } from '../../service/swapi.service';
import { Starship } from '../../model/starship.model';

describe('StarshipComponent', () => {
  let component: StarshipComponent;
  let fixture: ComponentFixture<StarshipComponent>;
  let getPageSpy: ReturnType<typeof vi.fn>;

  const mockStarship = {
    id: 9,
    name: 'Death Star',
    model: 'DS-1 Orbital Battle Station',
    manufacturer: 'Imperial Department of Military Research',
    crew: '342953',
    passengers: '843342',
    passenger: '843342',
    hyperdrive_rating: '4.0',
    url: 'https://swapi.dev/api/starships/9/',
  } as unknown as Starship;

  beforeEach(async () => {
    getPageSpy = vi.fn().mockReturnValue(
      of({ results: [mockStarship], hasNext: false, count: 1 })
    );

    await TestBed.configureTestingModule({
      imports: [StarshipComponent],
      providers: [{ provide: SwapiService, useValue: { getPage: getPageSpy } }],
    }).compileComponents();

    fixture = TestBed.createComponent(StarshipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load the first page of rows on init', () => {
    expect(getPageSpy).toHaveBeenCalledWith(1);
    expect(component.rows()).toEqual([mockStarship]);
    expect(component.isLoading()).toBe(false);
  });

  describe('editing behavior', () => {
    it('should enter edit mode with the current name pre-filled on startEdit', () => {
      component.startEdit(mockStarship);

      expect(component.editingId()).toBe(mockStarship.id);
      expect(component.editValue()).toBe('Death Star');
    });

    it('should commit a trimmed edited value to rows on confirmEdit', () => {
      component.startEdit(mockStarship);
      component.editValue.set('  Death Star II  ');

      component.confirmEdit(mockStarship.id);

      expect(component.rows()[0].name).toBe('Death Star II');
      expect(component.editingId()).toBe(null);
    });

    it('should not update rows when the edited value is empty or whitespace', () => {
      component.startEdit(mockStarship);
      component.editValue.set('   ');

      component.confirmEdit(mockStarship.id);

      expect(component.rows()[0].name).toBe('Death Star');
      expect(component.editingId()).toBe(null);
    });

    it('should discard changes on cancelEdit and suppress the next confirmEdit call', () => {
      component.startEdit(mockStarship);
      component.editValue.set('Should Not Save');

      component.cancelEdit();
      component.confirmEdit(mockStarship.id);

      expect(component.rows()[0].name).toBe('Death Star');
      expect(component.editingId()).toBe(null);
    });

    it('should filter rows by name via filteredRows without mutating the underlying rows', () => {
      component.rows.set([
        mockStarship,
        { ...mockStarship, id: 10, name: 'Executor' } as Starship,
      ]);

      component.onSearchChange('exec');

      expect(component.filteredRows().length).toBe(1);
      expect(component.filteredRows()[0].name).toBe('Executor');
      expect(component.rows().length).toBe(2);
    });
  });
});
