import { Component, OnInit, signal } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
}

interface MovieResponse {
  results: Movie[];
  total_pages: number;
  total_results: number;
}

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="movie-container">
      <div class="search-section">
        <h1>Movie Explorer</h1>
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (input)="onSearchChange()"
            placeholder="Search for movies..."
            class="search-input"
          >
          <button (click)="searchMovies()" class="search-button">Search</button>
        </div>
      </div>

      <div class="filters">
        <button 
          (click)="getPopularMovies()" 
          [class.active]="currentFilter === 'popular'"
          class="filter-button"
        >
          Popular
        </button>
        <button 
          (click)="getTopRatedMovies()" 
          [class.active]="currentFilter === 'top-rated'"
          class="filter-button"
        >
          Top Rated
        </button>
        <button 
          (click)="getNowPlayingMovies()" 
          [class.active]="currentFilter === 'now-playing'"
          class="filter-button"
        >
          Now Playing
        </button>
      </div>

      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Loading movies...</p>
      </div>

      <div class="error" *ngIf="error()">
        <p>{{ error() }}</p>
        <button (click)="retry()" class="retry-button">Retry</button>
      </div>

      <div class="movies-grid" *ngIf="!loading() && !error()">
        <div 
          class="movie-card" 
          *ngFor="let movie of movies()"
          (click)="selectMovie(movie)"
        >
          <div class="movie-poster">
            <img 
              [src]="getPosterUrl(movie.poster_path)" 
              [alt]="movie.title"
              (error)="onImageError($event)"
            >
            <div class="movie-rating">
              <span class="rating-text">{{ movie.vote_average.toFixed(1) }}</span>
            </div>
          </div>
          <div class="movie-info">
            <h3 class="movie-title">{{ movie.title }}</h3>
            <p class="movie-date">{{ formatDate(movie.release_date) }}</p>
            <p class="movie-overview">{{ truncateText(movie.overview, 100) }}</p>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="!loading() && !error() && movies().length > 0">
        <button 
          (click)="previousPage()" 
          [disabled]="currentPage === 1"
          class="page-button"
        >
          Previous
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages() }}</span>
        <button 
          (click)="nextPage()" 
          [disabled]="currentPage >= totalPages()"
          class="page-button"
        >
          Next
        </button>
      </div>

      <div class="no-results" *ngIf="!loading() && !error() && movies().length === 0">
        <p>No movies found. Try a different search term.</p>
      </div>
    </div>
  `,
  styles: [`
    .movie-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .search-section {
      text-align: center;
      margin-bottom: 30px;
    }

    .search-section h1 {
      color: #333;
      margin-bottom: 20px;
      font-size: 2.5rem;
      font-weight: 300;
    }

    .search-box {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .search-input {
      padding: 12px 16px;
      border: 2px solid #ddd;
      border-radius: 25px;
      font-size: 16px;
      width: 300px;
      outline: none;
      transition: border-color 0.3s ease;
    }

    .search-input:focus {
      border-color: #007bff;
    }

    .search-button {
      padding: 12px 24px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s ease;
    }

    .search-button:hover {
      background: #0056b3;
    }

    .filters {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 30px;
    }

    .filter-button {
      padding: 10px 20px;
      background: #f8f9fa;
      border: 2px solid #ddd;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .filter-button:hover,
    .filter-button.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .loading {
      text-align: center;
      padding: 50px;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error {
      text-align: center;
      padding: 50px;
      color: #dc3545;
    }

    .retry-button {
      padding: 10px 20px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 10px;
    }

    .movies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 25px;
      margin-bottom: 30px;
    }

    .movie-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
    }

    .movie-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .movie-poster {
      position: relative;
      height: 400px;
      overflow: hidden;
    }

    .movie-poster img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .movie-card:hover .movie-poster img {
      transform: scale(1.05);
    }

    .movie-rating {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .movie-info {
      padding: 20px;
    }

    .movie-title {
      margin: 0 0 10px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      line-height: 1.3;
    }

    .movie-date {
      color: #666;
      font-size: 14px;
      margin: 0 0 10px 0;
    }

    .movie-overview {
      color: #555;
      font-size: 14px;
      line-height: 1.4;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-top: 30px;
    }

    .page-button {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .page-button:hover:not(:disabled) {
      background: #0056b3;
    }

    .page-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 16px;
      color: #666;
    }

    .no-results {
      text-align: center;
      padding: 50px;
      color: #666;
    }

    @media (max-width: 768px) {
      .movie-container {
        padding: 15px;
      }

      .search-section h1 {
        font-size: 2rem;
      }

      .search-input {
        width: 250px;
      }

      .movies-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
      }

      .filters {
        flex-wrap: wrap;
      }
    }
  `]
})
export class MovieComponent implements OnInit {
  movies = signal<Movie[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = 1;
  totalPages = signal(1);
  searchQuery = '';
  currentFilter = 'popular';
  private searchTimeout: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getPopularMovies();
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if (this.searchQuery.trim()) {
        this.searchMovies();
      } else {
        this.getPopularMovies();
      }
    }, 500);
  }

  searchMovies() {
    if (!this.searchQuery.trim()) return;
    
    this.loading.set(true);
    this.error.set(null);
    this.currentFilter = 'search';
    
    const url = `https://api.themoviedb.org/3/search/movie?api_key=1b5c076a0e4849aeefd1f3c429c79c0f&query=${encodeURIComponent(this.searchQuery)}&page=${this.currentPage}`;
    
    this.http.get<MovieResponse>(url).subscribe({
      next: (response) => {
        this.movies.set(response.results);
        this.totalPages.set(response.total_pages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to search movies. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getPopularMovies() {
    this.loading.set(true);
    this.error.set(null);
    this.currentFilter = 'popular';
    this.currentPage = 1;
    
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=1b5c076a0e4849aeefd1f3c429c79c0f&page=${this.currentPage}`;
    
    this.http.get<MovieResponse>(url).subscribe({
      next: (response) => {
        this.movies.set(response.results);
        this.totalPages.set(response.total_pages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load popular movies. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getTopRatedMovies() {
    this.loading.set(true);
    this.error.set(null);
    this.currentFilter = 'top-rated';
    this.currentPage = 1;
    
    const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=1b5c076a0e4849aeefd1f3c429c79c0f&page=${this.currentPage}`;
    
    this.http.get<MovieResponse>(url).subscribe({
      next: (response) => {
        this.movies.set(response.results);
        this.totalPages.set(response.total_pages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load top rated movies. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getNowPlayingMovies() {
    this.loading.set(true);
    this.error.set(null);
    this.currentFilter = 'now-playing';
    this.currentPage = 1;
    
    const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=1b5c076a0e4849aeefd1f3c429c79c0f&page=${this.currentPage}`;
    
    this.http.get<MovieResponse>(url).subscribe({
      next: (response) => {
        this.movies.set(response.results);
        this.totalPages.set(response.total_pages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load now playing movies. Please try again.');
        this.loading.set(false);
      }
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.loadMoviesForCurrentFilter();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMoviesForCurrentFilter();
    }
  }

  private loadMoviesForCurrentFilter() {
    switch (this.currentFilter) {
      case 'popular':
        this.getPopularMovies();
        break;
      case 'top-rated':
        this.getTopRatedMovies();
        break;
      case 'now-playing':
        this.getNowPlayingMovies();
        break;
      case 'search':
        this.searchMovies();
        break;
    }
  }

  retry() {
    this.loadMoviesForCurrentFilter();
  }

  selectMovie(movie: Movie) {
    console.log('Selected movie:', movie);
    // You can implement navigation to a movie detail page here
  }

  getPosterUrl(posterPath: string): string {
    if (!posterPath) {
      return 'https://via.placeholder.com/300x450?text=No+Image';
    }
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  }

  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
