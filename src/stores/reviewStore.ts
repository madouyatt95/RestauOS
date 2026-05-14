import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Review {
  id: string;
  orderId: string;
  clientName: string;
  date: string;
  rating: number; // 1-5
  cuisine: number;
  service: number;
  ambiance: number;
  rapport: number;
  comment: string;
}

interface ReviewState {
  reviews: Review[];
  addReview: (r: Omit<Review, 'id'>) => void;
  getAverage: () => number;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [
        { id: 'r1', orderId: 'o1', clientName: 'Ousmane T.', date: new Date(Date.now() - 86400000).toISOString(), rating: 5, cuisine: 5, service: 5, ambiance: 4, rapport: 5, comment: 'Excellent thiéboudienne, service rapide!' },
        { id: 'r2', orderId: 'o2', clientName: 'Fatima D.', date: new Date(Date.now() - 172800000).toISOString(), rating: 4, cuisine: 5, service: 4, ambiance: 4, rapport: 3, comment: 'Très bon mais un peu cher.' },
        { id: 'r3', orderId: 'o3', clientName: 'Moussa S.', date: new Date(Date.now() - 259200000).toISOString(), rating: 5, cuisine: 5, service: 5, ambiance: 5, rapport: 5, comment: 'Le meilleur restaurant de Dakar!' },
        { id: 'r4', orderId: 'o4', clientName: 'Aïda N.', date: new Date(Date.now() - 345600000).toISOString(), rating: 3, cuisine: 4, service: 2, ambiance: 4, rapport: 3, comment: 'Cuisine top mais service lent ce soir.' },
        { id: 'r5', orderId: 'o5', clientName: 'Ibou K.', date: new Date(Date.now() - 432000000).toISOString(), rating: 4, cuisine: 4, service: 4, ambiance: 5, rapport: 4, comment: 'Ambiance magnifique, cadre superbe.' },
      ],
      addReview: (r) => set((s) => ({ reviews: [...s.reviews, { ...r, id: `r${Date.now()}` }] })),
      getAverage: () => {
        const r = get().reviews;
        return r.length > 0 ? r.reduce((a, c) => a + c.rating, 0) / r.length : 0;
      },
    }),
    { name: 'restauos-reviews' }
  )
);
