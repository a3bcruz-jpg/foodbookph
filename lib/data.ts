export type Restaurant = {
  id: string; name: string; cuisine: string; location: string; rating: number; reviews: number; image: string; accent: string; price: string; tags: string[]; claimed: boolean;
};
export type Post = { id: string; author: string; handle: string; avatar: string; time: string; caption: string; image: string; place: string; likes: number; comments: number; liked: boolean; saved: boolean };

export const restaurants: Restaurant[] = [
  { id: "r1", name: "Kubo Sa Bahay", cuisine: "Filipino · Modern", location: "Poblacion, Makati", rating: 4.8, reviews: 128, image: "https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&w=1000&q=85", accent: "#e6f0d8", price: "₱₱", tags: ["Kinilaw", "Comfort food"], claimed: true },
  { id: "r2", name: "Sari Sari Supper Club", cuisine: "Filipino · Asian", location: "Kapitolyo, Pasig", rating: 4.6, reviews: 86, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85", accent: "#f9dfc3", price: "₱₱₱", tags: ["Small plates", "Night out"], claimed: true },
  { id: "r3", name: "Lola Nena's", cuisine: "Bakery · Filipino", location: "San Juan City", rating: 4.9, reviews: 214, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=85", accent: "#f3e8c8", price: "₱", tags: ["Pastries", "Coffee"], claimed: false },
  { id: "r4", name: "Al Dente Manila", cuisine: "Italian", location: "New Manila, Quezon City", rating: 4.5, reviews: 64, image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=85", accent: "#dfe9ef", price: "₱₱₱", tags: ["Pasta", "Date night"], claimed: true },
];
export const posts: Post[] = [
  { id: "p1", author: "Mika Santos", handle: "@mikasays", avatar: "MS", time: "18 min ago", caption: "The kind of lunch that makes you text your friends immediately. Kubo's grilled liempo is unreal. 🍋", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85", place: "Kubo Sa Bahay · Makati", likes: 284, comments: 19, liked: false, saved: false },
  { id: "p2", author: "Paolo Reyes", handle: "@paoloeats", avatar: "PR", time: "2 hrs ago", caption: "Found a tiny bakery in San Juan with the best cheese rolls. No gatekeeping today.", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85", place: "Lola Nena's · San Juan", likes: 167, comments: 32, liked: true, saved: false },
];
