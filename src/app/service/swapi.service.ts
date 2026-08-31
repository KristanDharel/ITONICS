import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, map, Observable, of, tap, throwError} from 'rxjs';
import {Starship, SWAPIResponse} from '../model/starship.model';

@Injectable({
  providedIn: 'root',
})
export class SwapiService {
  private http = inject(HttpClient);
  private cache =  new Map<number, { results: Starship[]; hasNext: boolean; count: number }>();
  private baseUrl = 'https://swapi.dev/api/starships/';

  getPage(page: number): Observable<{ results: Starship[]; hasNext: boolean; count: number }>{
    if (this.cache.has(page)) {
      return of(this.cache.get(page)!);
    }
    return this.http.get<SWAPIResponse>(`${this.baseUrl}?page=${page}`).pipe(
      map((res)=>({
        results: res.results,
        hasNext: !!res.next,
        count: res.count
      })),
      tap((transformed)=>{
        this.cache.set(page,transformed);
      }),
      catchError((err)=>{
        console.log(err);
        return throwError(()=>err)
      })
    )
  }
}
