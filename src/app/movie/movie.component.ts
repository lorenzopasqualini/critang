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
  templateUrl: './movie.component.html',
  styleUrls: ['./movie.component.scss']
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
