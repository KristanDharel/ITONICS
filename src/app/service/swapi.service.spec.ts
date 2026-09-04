// swapi.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SwapiService } from './swapi.service';
import { SWAPIResponse } from '../model/starship.model';

describe('SwapiService', () => {
  let service: SwapiService;
  let httpMock: HttpTestingController;

  const mockResponse: SWAPIResponse = {
    count: 36,
    next: 'https://swapi.dev/api/starships/?page=2',
    previous: null,
    results: [
      {
        name: 'Death Star',
        model: 'DS-1 Orbital Battle Station',
        manufacturer: 'Imperial Department of Military Research',
        crew: '342953',
        passengers: '843342',
        hyperdrive_rating: '4.0',
        url: 'https://swapi.dev/api/starships/9/',
      } as any,
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), SwapiService],
    });
    service = TestBed.inject(SwapiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch a page, derive numeric id from url, and set hasNext from the next field', () => {
    service.getPage(1).subscribe((result) => {
      expect(result.results.length).toBe(1);
      expect(result.results[0].id).toBe(9);
      expect(result.hasNext).toBe(true);
      expect(result.count).toBe(36);
    });

    const req = httpMock.expectOne('https://swapi.dev/api/starships/?page=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should set hasNext to false when the response has no next page', () => {
    const lastPageResponse: SWAPIResponse = { ...mockResponse, next: null };

    service.getPage(2).subscribe((result) => {
      expect(result.hasNext).toBe(false);
    });

    const req = httpMock.expectOne('https://swapi.dev/api/starships/?page=2');
    req.flush(lastPageResponse);
  });

  it('should cache a fetched page and not issue a second HTTP request for it', () => {
    service.getPage(1).subscribe();
    httpMock.expectOne('https://swapi.dev/api/starships/?page=1').flush(mockResponse);

    service.getPage(1).subscribe((result) => {
      expect(result.results[0].id).toBe(9);
    });

    httpMock.expectNone('https://swapi.dev/api/starships/?page=1');
  });

  it('should propagate an error when the request fails', () => {
    let caughtError: unknown;

    service.getPage(1).subscribe({
      next: () => {
        throw new Error('expected an error, got a value');
      },
      error: (err) => (caughtError = err),
    });

    const req = httpMock.expectOne('https://swapi.dev/api/starships/?page=1');
    req.flush('server error', { status: 500, statusText: 'Server Error' });

    expect(caughtError).toBeTruthy();
  });
});
