"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Bookmark,
  ChevronRight,
  Compass,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { posts as seedPosts, restaurants } from "@/lib/data";
import type { Post } from "@/lib/data";

type View = "home" | "discover" | "restaurants" | "food" | "profile";
type ReviewStatus = "unverified" | "verified";
type ReviewReason =
  | "Spam"
  | "Fake or misleading"
  | "Personal attack"
  | "Harassment"
  | "Hate speech"
  | "Advertising / competitor promotion"
  | "Other";

type ReviewOwnerResponse = {
  id: string;
  ownerId: string;
  body: string;
  createdAt: string;
};

type ReviewReport = {
  id: string;
  reviewId: string;
  reporterId: string;
  reason: ReviewReason;
  status: "OPEN";
  createdAt: string;
};

type RestaurantReview = {
  id: string;
  userId: string;
  restaurantId: string;
  rating: number;
  title: string;
  body: string;
  food: number;
  service: number;
  ambience: number;
  value: number;
  wentWell: string;
  couldImprove: string;
  createdAt: string;
  status: ReviewStatus;
  ownerResponse?: ReviewOwnerResponse | null;
  reports: ReviewReport[];
};

type ReviewDraft = {
  rating: number;
  title: string;
  body: string;
  food: number;
  service: number;
  ambience: number;
  value: number;
  wentWell: string;
  couldImprove: string;
};

type Viewer = { name: string; handle: string; initials: string; posts: number; reviews: number; following: number; isOwner: boolean };
const anonymousViewer: Viewer = { name: "Your profile", handle: "", initials: "?", posts: 0, reviews: 0, following: 0, isOwner: false };

const reviewSeed: Record<string, RestaurantReview[]> = {
  r1: [
    {
      id: "rev_r1_1",
      userId: "u_1",
      restaurantId: "r1",
      rating: 4,
      title: "A warm neighborhood favorite",
      body:
        "The grilled liempo was excellent and the place felt lively without being loud. Service was friendly and the portions were generous.",
      food: 5,
      service: 4,
      ambience: 4,
      value: 5,
      wentWell: "Flavor and generous portions",
      couldImprove: "A little more attention during peak dinner rush",
      createdAt: "2026-09-05T12:00:00.000Z",
      status: "unverified",
      reports: [],
    },
  ],
  r2: [
    {
      id: "rev_r2_1",
      userId: "u_2",
      restaurantId: "r2",
      rating: 3,
      title: "Good atmosphere, slow service on a busy night",
      body:
        "The tasting menu was creative and the bar has a nice energy. We just waited quite a while for the main course, so it felt uneven.",
      food: 4,
      service: 2,
      ambience: 5,
      value: 3,
      wentWell: "Atmosphere and menu creativity",
      couldImprove: "Service pacing during busy hours",
      createdAt: "2026-09-04T18:15:00.000Z",
      status: "unverified",
      reports: [],
      ownerResponse: {
        id: "resp_r2_1",
        ownerId: "owner_1",
        body:
          "Thank you for sharing this. We are glad you enjoyed the atmosphere and menu, and we are reviewing our service flow during busy hours so we can improve the pacing of each course.",
        createdAt: "2026-09-04T21:00:00.000Z",
      },
    },
  ],
  r3: [
    {
      id: "rev_r3_1",
      userId: "u_3",
      restaurantId: "r3",
      rating: 5,
      title: "The pastries are worth the trip",
      body:
        "Everything was fresh and the cheese rolls were still warm when we arrived. This is the kind of neighborhood bakery I keep recommending.",
      food: 5,
      service: 5,
      ambience: 4,
      value: 5,
      wentWell: "Fresh bakery items and warm service",
      couldImprove: "More seating during lunch rush",
      createdAt: "2026-09-03T15:00:00.000Z",
      status: "unverified",
      reports: [],
    },
  ],
};

function clampMetric(value: number) {
  if (Number.isNaN(value)) return 3;
  return Math.min(5, Math.max(1, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1));
}

function getReviewSnapshot(reviews: RestaurantReview[]) {
  if (!reviews.length) return null;
  const food = average(reviews.map((review) => review.food));
  const service = average(reviews.map((review) => review.service));
  const ambience = average(reviews.map((review) => review.ambience));
  const value = average(reviews.map((review) => review.value));
  const notes = reviews
    .map((review) => review.wentWell)
    .filter(Boolean)
    .slice(0, 3);

  return {
    averageRating: average(reviews.map((review) => review.rating)),
    food,
    service,
    ambience,
    value,
    notes,
    ownerResponding: reviews.some((review) => Boolean(review.ownerResponse)),
    communityReviewed: reviews.length > 0,
    recentlyUpdated: reviews.some(
      (review) => Date.now() - new Date(review.createdAt).getTime() < 1000 * 60 * 60 * 24 * 14,
    ),
  };
}

const emptyReviewDraft = (): ReviewDraft => ({
  rating: 4,
  title: "",
  body: "",
  food: 4,
  service: 3,
  ambience: 4,
  value: 4,
  wentWell: "",
  couldImprove: "",
});

export function FoodBookApp() {
  const [viewer, setViewer] = useState<Viewer>(anonymousViewer);
  const [view, setView] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState(seedPosts);
  const [following, setFollowing] = useState<string[]>(["r1"]);
  const [showComposer, setShowComposer] = useState(false);
  const [notice, setNotice] = useState("");
  const [reviewDraft, setReviewDraft] = useState<{ restaurantId: string; values: ReviewDraft } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ restaurantId: string; reviewId: string } | null>(null);
  const [ownerResponseTarget, setOwnerResponseTarget] = useState<{ restaurantId: string; reviewId: string } | null>(null);
  const [restaurantReviews, setRestaurantReviews] = useState<Record<string, RestaurantReview[]>>(reviewSeed);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => response.ok ? response.json() as Promise<{ account: { displayName: string; username: string; roles: string[] } }> : null)
      .then((data) => {
        if (!data?.account) return;
        setViewer((current) => ({ ...current, name: data.account.displayName, handle: `@${data.account.username}`, initials: data.account.displayName.slice(0, 2).toUpperCase(), isOwner: data.account.roles.includes("RESTAURANT_OWNER") || data.account.roles.includes("ADMIN") }));
      })
      .catch(() => undefined);
  }, []);

  const filteredRestaurants = useMemo(
    () =>
      restaurants.filter((restaurant) =>
        `${restaurant.name} ${restaurant.cuisine} ${restaurant.location}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const toggleLike = (id: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              liked: !post.liked,
              likes: post.likes + (post.liked ? -1 : 1),
            }
          : post,
      ),
    );
  };

  const toggleSave = (id: string) =>
    setPosts((current) =>
      current.map((post) => (post.id === id ? { ...post, saved: !post.saved } : post)),
    );

  const toggleFollow = (id: string) => {
    const alreadyFollowing = following.includes(id);
    setFollowing((current) =>
      alreadyFollowing ? current.filter((item) => item !== id) : [...current, id],
    );
    setNotice(alreadyFollowing ? "Restaurant removed from following" : "Now following this restaurant");
    setTimeout(() => setNotice(""), 2500);
  };

  const addReview = (restaurantId: string, values: ReviewDraft) => {
    const nextReview: RestaurantReview = {
      id: `rev_${Date.now()}`,
      userId: viewer.handle || viewer.name,
      restaurantId,
      rating: clampMetric(values.rating),
      title: values.title.trim() || "Recent visit",
      body: values.body.trim(),
      food: clampMetric(values.food),
      service: clampMetric(values.service),
      ambience: clampMetric(values.ambience),
      value: clampMetric(values.value),
      wentWell: values.wentWell.trim(),
      couldImprove: values.couldImprove.trim(),
      createdAt: new Date().toISOString(),
      status: "unverified",
      reports: [],
    };

    setRestaurantReviews((current) => ({
      ...current,
      [restaurantId]: [nextReview, ...(current[restaurantId] ?? [])],
    }));
    setNotice("Your review is live. Honest feedback helps diners and restaurants.");
    setTimeout(() => setNotice(""), 2600);
  };

  const addOwnerResponse = (restaurantId: string, reviewId: string, body: string) => {
    setRestaurantReviews((current) => ({
      ...current,
      [restaurantId]: (current[restaurantId] ?? []).map((review) =>
        review.id === reviewId
          ? {
              ...review,
              ownerResponse: {
                id: `resp_${Date.now()}`,
                ownerId: viewer.handle || viewer.name,
                body: body.trim(),
                createdAt: new Date().toISOString(),
              },
            }
          : review,
      ),
    }));
    setNotice("Owner response added.");
    setTimeout(() => setNotice(""), 2200);
  };

  const addReviewReport = (restaurantId: string, reviewId: string, reason: ReviewReason) => {
    setRestaurantReviews((current) => ({
      ...current,
      [restaurantId]: (current[restaurantId] ?? []).map((review) =>
        review.id === reviewId
          ? {
              ...review,
              reports: [
                {
                  id: `report_${Date.now()}`,
                  reviewId,
                  reporterId: viewer.handle || viewer.name,
                  reason,
                  status: "OPEN",
                  createdAt: new Date().toISOString(),
                },
                ...review.reports,
              ],
            }
          : review,
      ),
    }));
    setNotice("Review reported and stored for moderation.");
    setTimeout(() => setNotice(""), 2400);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => setView("home")}>
            <span className="brand-mark">F</span>
            <span>
              foodbook<span className="brand-accent">PH</span>
            </span>
          </button>
          <div className="top-search">
            <Search size={17} />
            <input
              aria-label="Search restaurants, food, or places"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setView("discover");
              }}
              placeholder="Search places, dishes, people"
            />
          </div>
          <div className="header-actions">
            <button className="icon-button" aria-label="Notifications" onClick={() => setNotice("You are all caught up")}>
              <Bell size={19} />
              <span className="notification-dot" />
            </button>
              <Link className="profile-chip" href={viewer.isOwner ? "/owner" : "/profile"}>
                <span className="avatar avatar-small">{viewer.initials}</span>
                <span className="profile-chip-name">{viewer.name}</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="page-grid">
        <aside className="sidebar">
          <nav>
            <NavButton icon={<Home size={19} />} label="Home" active={view === "home"} onClick={() => setView("home")} />
            <NavButton icon={<Compass size={19} />} label="Discover" active={view === "discover"} onClick={() => setView("discover")} />
            <NavButton icon={<Store size={19} />} label="Restaurants" active={view === "restaurants"} onClick={() => setView("restaurants")} />
            <NavButton icon={<Utensils size={19} />} label="Food feed" active={view === "food"} onClick={() => setView("food")} />
            <NavButton icon={<UserRound size={19} />} label={viewer.isOwner ? "Owner dashboard" : "My profile"} active={view === "profile"} onClick={() => viewer.isOwner ? window.location.assign("/owner") : setView("profile")} />
          </nav>
          <div className="sidebar-rule" />
          <button
            className="owner-link"
            onClick={() => {
              setNotice("Claim request submitted");
              setTimeout(() => setNotice(""), 2400);
            }}
          >
            <span className="owner-icon">
              <Store size={17} />
            </span>
            <span>
              <strong>Are you the owner or manager?</strong>
              <small>Claim your restaurant to keep your information updated, respond to reviews, and share what&apos;s new.</small>
            </span>
            <ChevronRight size={16} />
          </button>
          <div className="sidebar-foot">
            © 2026 FoodBookPH
            <br />
            <span>Made for the local food scene</span>
          </div>
        </aside>
        <section className="content">
          {view === "home" && (
            <HomeView
              posts={posts}
              toggleLike={toggleLike}
              toggleSave={toggleSave}
              onCompose={() => setShowComposer(true)}
              onViewRestaurants={() => setView("restaurants")}
            />
          )}{" "}
          {view === "food" && (
            <FeedView posts={posts} toggleLike={toggleLike} toggleSave={toggleSave} />
          )}{" "}
          {view === "discover" && (
            <DiscoverView
              restaurants={filteredRestaurants}
              query={query}
              following={following}
              toggleFollow={toggleFollow}
              onClear={() => setQuery("")}
              restaurantReviews={restaurantReviews}
              onReview={(restaurantId) => setReviewDraft({ restaurantId, values: emptyReviewDraft() })}
              onReport={(restaurantId, reviewId) => setReportTarget({ restaurantId, reviewId })}
              onRespond={(restaurantId, reviewId) => setOwnerResponseTarget({ restaurantId, reviewId })}
            />
          )}{" "}
          {view === "restaurants" && (
            <RestaurantsView
              restaurants={filteredRestaurants}
              query={query}
              following={following}
              toggleFollow={toggleFollow}
              onClear={() => setQuery("")}
              restaurantReviews={restaurantReviews}
              onReview={(restaurantId) => setReviewDraft({ restaurantId, values: emptyReviewDraft() })}
              onReport={(restaurantId, reviewId) => setReportTarget({ restaurantId, reviewId })}
              onRespond={(restaurantId, reviewId) => setOwnerResponseTarget({ restaurantId, reviewId })}
            />
          )}{" "}
          {view === "profile" && <ProfileView posts={posts} viewer={viewer} />} {" "}
        </section>
        <aside className="right-rail">
          <div className="rail-card">
            <div className="rail-heading">
              <h3>Popular near you</h3>
              <button onClick={() => setView("restaurants")}>See all</button>
            </div>
            {restaurants.slice(0, 3).map((restaurant) => (
              <RestaurantMini key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
          <div className="rail-card mustard-card">
            <span className="eyebrow">FOR RESTAURANT OWNERS</span>
            <h3>Your place deserves a seat at the table.</h3>
            <p>Claim your listing, share what is new, and connect with diners who care about honest feedback.</p>
            <button
              onClick={() => {
                setNotice("Claim this restaurant");
                setTimeout(() => setNotice(""), 2200);
              }}
            >
              Claim this restaurant <ChevronRight size={15} />
            </button>
          </div>
        </aside>
      </main>
      <nav className="mobile-nav">
        <NavButton icon={<Home size={20} />} label="Home" active={view === "home"} onClick={() => setView("home")} />
        <NavButton icon={<Compass size={20} />} label="Discover" active={view === "discover"} onClick={() => setView("discover")} />
        <button className="mobile-add" onClick={() => setShowComposer(true)} aria-label="Create post">
          <Plus size={24} />
        </button>
        <NavButton icon={<Utensils size={20} />} label="Food" active={view === "food"} onClick={() => setView("food")} />
        <NavButton icon={<UserRound size={20} />} label={viewer.isOwner ? "Owner" : "Profile"} active={view === "profile"} onClick={() => viewer.isOwner ? window.location.assign("/owner") : setView("profile")} />
      </nav>
      {showComposer && (
        <Composer
          onClose={() => setShowComposer(false)}
          onPublish={(caption, image) => {
            const newPost: Post = {
              id: `p${Date.now()}`,
              author: viewer.name,
              handle: viewer.handle,
              avatar: viewer.initials,
              time: "just now",
              caption,
              image,
              place: "Your food diary",
              likes: 0,
              comments: 0,
              liked: false,
              saved: false,
            };
            setPosts((current) => [newPost, ...current]);
            setShowComposer(false);
            setNotice("Your post is live");
            setTimeout(() => setNotice(""), 2500);
          }}
        />
      )}
      {reviewDraft && (
        <ReviewComposer
          restaurantId={reviewDraft.restaurantId}
          draft={reviewDraft.values}
          onChange={(values) => setReviewDraft((current) => (current ? { ...current, values } : current))}
          onClose={() => setReviewDraft(null)}
          onSubmit={(restaurantId, values) => {
            addReview(restaurantId, values);
            setReviewDraft(null);
          }}
        />
      )}
      {reportTarget && (
        <ReportComposer
          onClose={() => setReportTarget(null)}
          onSubmit={(reason) => {
            addReviewReport(reportTarget.restaurantId, reportTarget.reviewId, reason);
            setReportTarget(null);
          }}
        />
      )}
      {ownerResponseTarget && (
        <OwnerResponseComposer
          onClose={() => setOwnerResponseTarget(null)}
          onSubmit={(body) => {
            addOwnerResponse(ownerResponseTarget.restaurantId, ownerResponseTarget.reviewId, body);
            setOwnerResponseTarget(null);
          }}
        />
      )}
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span className="nav-button-label">{label}</span>
    </button>
  );
}

function HomeView({ posts, toggleLike, toggleSave, onCompose, onViewRestaurants }: { posts: Post[]; toggleLike: (id: string) => void; toggleSave: (id: string) => void; onCompose: () => void; onViewRestaurants: () => void }) {
  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">SATURDAY, SEPTEMBER 06</span>
          <h1>
            Good food finds
            <br />
            <em>good company.</em>
          </h1>
          <p className="intro">See what your city is tasting today.</p>
        </div>
        <button className="primary-button" onClick={onCompose}>
          <Plus size={17} /> Share a food find
        </button>
      </div>
      <section className="feature-band">
        <div>
          <span className="eyebrow">WEEKEND EDIT</span>
          <h2>
            Tables worth
            <br />
            traveling for
          </h2>
          <p>Three spots our community is talking about this week.</p>
          <button className="text-button" onClick={onViewRestaurants}>
            Explore the edit <ChevronRight size={15} />
          </button>
        </div>
        <div className="feature-image">
          <img src="https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85" alt="A colorful Filipino meal shared at a table" />
          <span className="image-label">Makati · 12 finds</span>
        </div>
      </section>
      <FeedHeader title="From your food circle" action="View all" />
      <div className="feed-stack">
        {posts.slice(0, 2).map((post) => (
          <PostCard key={post.id} post={post} toggleLike={toggleLike} toggleSave={toggleSave} />
        ))}
      </div>
    </>
  );
}

function FeedView({ posts, toggleLike, toggleSave }: { posts: Post[]; toggleLike: (id: string) => void; toggleSave: (id: string) => void }) {
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE COMMUNITY TABLE</span>
          <h1>Food feed</h1>
          <p>Real plates, honest reviews, no gatekeeping.</p>
        </div>
        <button className="filter-button">
          <SlidersHorizontal size={16} /> Latest
        </button>
      </div>
      <div className="feed-stack">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} toggleLike={toggleLike} toggleSave={toggleSave} />
        ))}
      </div>
    </>
  );
}

function FeedHeader({ title, action }: { title: string; action: string }) {
  return (
    <div className="feed-header">
      <h2>{title}</h2>
      <button>
        {action} <ChevronRight size={15} />
      </button>
    </div>
  );
}

function PostCard({ post, toggleLike, toggleSave }: { post: Post; toggleLike: (id: string) => void; toggleSave: (id: string) => void }) {
  return (
    <article className="post-card">
      <div className="post-top">
        <div className="post-author">
          <span className="avatar">{post.avatar}</span>
          <span>
            <strong>{post.author}</strong>
            <small>
              {post.handle} · {post.time}
            </small>
          </span>
        </div>
        <button className="more-button" aria-label="More options">
          •••
        </button>
      </div>
      <p className="post-caption">{post.caption}</p>
      <div className="post-photo">
        <img src={post.image} alt={post.caption} />
        <span className="place-tag">
          <MapPin size={13} /> {post.place}
        </span>
      </div>
      <div className="post-actions">
        <button className={post.liked ? "liked" : ""} onClick={() => toggleLike(post.id)}>
          <Heart size={18} fill={post.liked ? "currentColor" : "none"} /> {post.likes}
        </button>
        <button>
          <MessageCircle size={18} /> {post.comments}
        </button>
        <button className="save-action" onClick={() => toggleSave(post.id)} aria-label="Save post">
          <Bookmark size={18} fill={post.saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}

function DiscoverView({ restaurants: list, query, following, toggleFollow, onClear, restaurantReviews, onReview, onReport, onRespond }: { restaurants: typeof restaurants; query: string; following: string[]; toggleFollow: (id: string) => void; onClear: () => void; restaurantReviews: Record<string, RestaurantReview[]>; onReview: (restaurantId: string) => void; onReport: (restaurantId: string, reviewId: string) => void; onRespond: (restaurantId: string, reviewId: string) => void }) {
  return (
    <>
      <div className="section-heading discover-heading">
        <div>
          <span className="eyebrow">PLACES TO TASTE</span>
          <h1>{query ? `Results for “${query}”` : "Discover your next favorite"}</h1>
          <p>Independent spots, neighborhood staples, and hidden gems.</p>
        </div>
        <button className="filter-button">
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>
      {query && (
        <button className="clear-search" onClick={onClear}>
          <X size={14} /> Clear search
        </button>
      )}
      <div className="restaurant-grid">
        {list.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            following={following.includes(restaurant.id)}
            toggleFollow={toggleFollow}
            reviews={restaurantReviews[restaurant.id] ?? []}
            onReview={onReview}
            onReport={onReport}
            onRespond={onRespond}
          />
        ))}
        {list.length === 0 && (
          <div className="empty-state">
            <Search size={28} />
            <h3>No places found</h3>
            <p>Try a city, cuisine, or restaurant name.</p>
          </div>
        )}
      </div>
    </>
  );
}

function RestaurantsView({ restaurants: list, query, following, toggleFollow, onClear, restaurantReviews, onReview, onReport, onRespond }: { restaurants: typeof restaurants; query: string; following: string[]; toggleFollow: (id: string) => void; onClear: () => void; restaurantReviews: Record<string, RestaurantReview[]>; onReview: (restaurantId: string) => void; onReport: (restaurantId: string, reviewId: string) => void; onRespond: (restaurantId: string, reviewId: string) => void }) {
  return (
    <>
      <div className="section-heading discover-heading">
        <div>
          <span className="eyebrow">FOODBOOKPH DIRECTORY</span>
          <h1>{query ? `Restaurants matching “${query}”` : "Restaurants"}</h1>
          <p>Browse local spots, neighborhood staples, and new favorites.</p>
        </div>
        <button className="filter-button">
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>
      {query && (
        <button className="clear-search" onClick={onClear}>
          <X size={14} /> Clear search
        </button>
      )}
      <div className="restaurant-grid">
        {list.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            following={following.includes(restaurant.id)}
            toggleFollow={toggleFollow}
            reviews={restaurantReviews[restaurant.id] ?? []}
            onReview={onReview}
            onReport={onReport}
            onRespond={onRespond}
          />
        ))}
        {list.length === 0 && (
          <div className="empty-state">
            <Search size={28} />
            <h3>No restaurants found</h3>
            <p>Try a city, cuisine, or restaurant name.</p>
          </div>
        )}
      </div>
    </>
  );
}

function RestaurantCard({ restaurant, following, toggleFollow, reviews, onReview, onReport, onRespond }: { restaurant: (typeof restaurants)[number]; following: boolean; toggleFollow: (id: string) => void; reviews: RestaurantReview[]; onReview: (restaurantId: string) => void; onReport: (restaurantId: string, reviewId: string) => void; onRespond: (restaurantId: string, reviewId: string) => void }) {
  const snapshot = getReviewSnapshot(reviews);
  const latestReviews = reviews.slice(0, 2);

  return (
    <article className="restaurant-card">
      <div className="restaurant-photo">
        <img src={restaurant.image} alt={restaurant.name} />
        <span className="price-pill">{restaurant.price}</span>
      </div>
      <div className="restaurant-details">
        <div className="restaurant-title">
          <div>
            <h3><Link href={`/restaurants/${restaurant.id}`}>{restaurant.name}</Link></h3>
            <p>{restaurant.cuisine}</p>
          </div>
          <span className="rating">
            <Star size={14} fill="currentColor" /> {snapshot ? snapshot.averageRating.toFixed(1) : restaurant.rating}
          </span>
        </div>
        <div className="restaurant-meta">
          <MapPin size={14} /> {restaurant.location} <span>·</span> {restaurant.reviews} reviews
        </div>
        <div className="tag-row">
          {restaurant.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        {snapshot && (
          <div className="community-snapshot">
            <div className="mini-label">COMMUNITY SNAPSHOT</div>
            <div className="snapshot-grid">
              <div>
                <span>Food</span>
                <strong>★ {snapshot.food.toFixed(1)}</strong>
              </div>
              <div>
                <span>Service</span>
                <strong>★ {snapshot.service.toFixed(1)}</strong>
              </div>
              <div>
                <span>Ambience</span>
                <strong>★ {snapshot.ambience.toFixed(1)}</strong>
              </div>
              <div>
                <span>Value</span>
                <strong>★ {snapshot.value.toFixed(1)}</strong>
              </div>
            </div>
            {snapshot.notes.length > 0 && (
              <p>People often mention: {snapshot.notes.join(" • ")}</p>
            )}
          </div>
        )}
        <div className="trust-badges">
          {restaurant.claimed && <span className="trust-badge">Claimed</span>}
          {snapshot?.ownerResponding && <span className="trust-badge">Owner responding</span>}
          {snapshot?.recentlyUpdated && <span className="trust-badge">Recently updated</span>}
          {snapshot?.communityReviewed && <span className="trust-badge">Community reviewed</span>}
        </div>
        {latestReviews.length > 0 && (
          <div className="restaurant-reviews">
            {latestReviews.map((review) => (
              <div key={review.id} className="mini-review">
                <div className="mini-review-head">
                  <strong>{review.title || "Recent review"}</strong>
                  <span>★ {review.rating}</span>
                </div>
                <p>{review.body}</p>
                {review.ownerResponse && (
                  <div className="owner-response-note">
                    <span>OWNER RESPONSE</span>
                    <p>{review.ownerResponse.body}</p>
                  </div>
                )}
                <div className="review-actions">
                  <button onClick={() => onReport(restaurant.id, review.id)}>Report review</button>
                  {restaurant.claimed && (
                    <button onClick={() => onRespond(restaurant.id, review.id)}>Respond as owner</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="restaurant-footer">
          {restaurant.claimed ? (
            <span className="claimed">
              <span /> Claimed
            </span>
          ) : (
            <span className="unclaimed">Unclaimed</span>
          )}
          <div className="restaurant-actions">
            <button className="outline-button small" onClick={() => onReview(restaurant.id)}>
              Write review
            </button>
            <Link className="outline-button small" href={`/restaurants/${restaurant.id}`}>
              View menu
            </Link>
            <button onClick={() => toggleFollow(restaurant.id)} className={following ? "following" : "follow-button"}>
              {following ? "Following" : "Follow"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function RestaurantMini({ restaurant }: { restaurant: (typeof restaurants)[number] }) {
  return (
    <div className="mini-restaurant">
      <img src={restaurant.image} alt="" />
      <div>
        <strong>{restaurant.name}</strong>
        <small>
          <Star size={12} fill="currentColor" /> {restaurant.rating} · {restaurant.cuisine}
        </small>
      </div>
      <ChevronRight size={15} />
    </div>
  );
}

function ProfileView({ posts, viewer }: { posts: Post[]; viewer: Viewer }) {
  return (
    <>
      <div className="profile-header">
        <span className="profile-avatar">{viewer.initials}</span>
        <div className="profile-copy">
          <span className="eyebrow">FOODBOOK MEMBER</span>
          <h1>{viewer.name}</h1>
          <p>{viewer.handle ? `${viewer.handle} · Quezon City` : "Sign in to see your profile"}</p>
          <button className="outline-button">Edit profile</button>
        </div>
      </div>
      <div className="profile-stats">
        <div>
          <strong>{viewer.posts}</strong>
          <span>posts</span>
        </div>
        <div>
          <strong>{viewer.reviews}</strong>
          <span>reviews</span>
        </div>
        <div>
          <strong>{viewer.following}</strong>
          <span>following</span>
        </div>
      </div>
      <FeedHeader title="Your latest finds" action="Review history" />
      <div className="profile-post-grid">
        {posts.map((post) => (
          <img key={post.id} src={post.image} alt={post.caption} />
        ))}
      </div>
    </>
  );
}

function ReviewComposer({ restaurantId, draft, onChange, onClose, onSubmit }: { restaurantId: string; draft: ReviewDraft; onChange: (draft: ReviewDraft) => void; onClose: () => void; onSubmit: (restaurantId: string, draft: ReviewDraft) => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="composer review-composer" onClick={(event) => event.stopPropagation()}>
        <div className="composer-head">
          <h2>Leave a review</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <p className="review-guidance">Share what you experienced. Honest feedback helps diners and restaurants.</p>
        <p className="review-guidance secondary">Focus on your experience and avoid personal attacks.</p>

        <div className="field-grid">
          <label>
            Restaurant
            <select value={restaurantId} onChange={(event) => onSubmit(event.target.value, draft)}>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-field">
            <span>Overall rating</span>
            <div className="star-row">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" className={value <= draft.rating ? "star-button active" : "star-button"} onClick={() => onChange({ ...draft, rating: value })}>
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="metric-grid">
          <label>
            Food
            <input type="number" min={1} max={5} value={draft.food} onChange={(event) => onChange({ ...draft, food: clampMetric(Number(event.target.value)) })} />
          </label>
          <label>
            Service
            <input type="number" min={1} max={5} value={draft.service} onChange={(event) => onChange({ ...draft, service: clampMetric(Number(event.target.value)) })} />
          </label>
          <label>
            Ambience
            <input type="number" min={1} max={5} value={draft.ambience} onChange={(event) => onChange({ ...draft, ambience: clampMetric(Number(event.target.value)) })} />
          </label>
          <label>
            Value
            <input type="number" min={1} max={5} value={draft.value} onChange={(event) => onChange({ ...draft, value: clampMetric(Number(event.target.value)) })} />
          </label>
        </div>

        <label>
          Review title
          <input value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} placeholder="Great food, service could improve" />
        </label>

        <label>
          Review details
          <textarea value={draft.body} onChange={(event) => onChange({ ...draft, body: event.target.value })} placeholder="The food was excellent and the portions were generous. Service was a little slow during our visit." />
        </label>

        <label>
          What went well?
          <input value={draft.wentWell} onChange={(event) => onChange({ ...draft, wentWell: event.target.value })} placeholder="Food quality and portions" />
        </label>

        <label>
          What could be improved?
          <input value={draft.couldImprove} onChange={(event) => onChange({ ...draft, couldImprove: event.target.value })} placeholder="Waiting time" />
        </label>

        <div className="composer-foot">
          <span className="meta-note">{draft.body.trim().length}/2000</span>
          <button className="primary-button" disabled={!draft.title.trim() || !draft.body.trim()} onClick={() => onSubmit(restaurantId, draft)}>
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportComposer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: ReviewReason) => void }) {
  const reasons: ReviewReason[] = [
    "Spam",
    "Fake or misleading",
    "Personal attack",
    "Harassment",
    "Hate speech",
    "Advertising / competitor promotion",
    "Other",
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="composer report-composer" onClick={(event) => event.stopPropagation()}>
        <div className="composer-head">
          <h2>Report review</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <p className="review-guidance">This does not delete the review immediately. Reports are stored for moderation review.</p>
        <div className="report-list">
          {reasons.map((reason) => (
            <button key={reason} type="button" className="report-option" onClick={() => onSubmit(reason)}>
              {reason}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OwnerResponseComposer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (body: string) => void }) {
  const [body, setBody] = useState("");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="composer owner-response-composer" onClick={(event) => event.stopPropagation()}>
        <div className="composer-head">
          <h2>Respond as owner</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Thank you for sharing this..."
        />
        <div className="composer-foot">
          <span className="meta-note">{body.trim().length}/800</span>
          <button className="primary-button" disabled={!body.trim()} onClick={() => onSubmit(body.trim())}>
            Post response
          </button>
        </div>
      </div>
    </div>
  );
}

function Composer({ onClose, onPublish }: { onClose: () => void; onPublish: (caption: string, image: string) => void }) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="composer" onClick={(event) => event.stopPropagation()}>
        <div className="composer-head">
          <h2>Share a food find</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="What did you eat, and would you go back?" autoFocus />
        <div className="upload-preview">
          <img src={image} alt="Selected food preview" />
          <button onClick={() => setImage("https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85")}>
            <Plus size={16} /> Change photo
          </button>
        </div>
        <div className="composer-foot">
          <span>{caption.length}/280</span>
          <button className="primary-button" disabled={!caption.trim()} onClick={() => onPublish(caption, image)}>
            Publish post
          </button>
        </div>
      </div>
    </div>
  );
}
