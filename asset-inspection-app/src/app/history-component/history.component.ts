import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  inspections: any[] = [];
  filtered: any[] = [];
  searchText = '';
  loading = true;

  editMode = false;
  editData: any = null;
  photoUrl = '';

  private apiUrl = 'http://127.0.0.1:5000/api/inspections';

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    const user = this.auth.getCurrentUser();
    if (!user?.id) {
      this.loading = false;
      alert('Please login again');
      this.router.navigate(['/login']);
      return;
    }

    // ✅ user_id query param அனுப்புறோம் — அந்த user data மட்டும் வரும்
    this.http.get<any>(`${this.apiUrl}?user_id=${user.id}`).subscribe({
      next: (res) => {
        this.inspections = res.inspections || [];
        this.filtered = [...this.inspections];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Backend running-ஆ check பண்ணுங்க!');
      }
    });
  }

  search() {
    const q = this.searchText.toLowerCase();
    this.filtered = this.inspections.filter(i =>
      i.project_name?.toLowerCase().includes(q) ||
      i.person_name?.toLowerCase().includes(q) ||
      i.asset_name?.toLowerCase().includes(q)
    );
  }

  openEdit(item: any) { this.editData = { ...item }; this.editMode = true; }
  closeEdit() { this.editMode = false; this.editData = null; }

  saveEdit() {
    this.http.put(`${this.apiUrl}/${this.editData.id}`, this.editData).subscribe({
      next: () => { this.closeEdit(); this.loadData(); },
      error: (err) => alert('Update failed: ' + err.message)
    });
  }

  deleteItem(id: number) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => this.loadData(),
      error: (err) => alert('Delete failed: ' + err.message)
    });
  }

  viewPhoto(url: string) { this.photoUrl = url; }
  goToForm() { this.router.navigate(['/form']); }
}