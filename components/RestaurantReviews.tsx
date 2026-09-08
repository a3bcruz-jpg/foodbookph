"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

const SERVICE_FIELDS = [
  ["foodQuality", "Food quality"],
  ["customerService", "Customer service"],
  ["staffFriendliness", "Staff friendliness"],
  ["speedOfService", "Speed of service"],
  ["cleanliness", "Cleanliness"],
  ["ambiance", "Ambiance"],
  ["valueForMoney", "Value for money"],
  ["overallExperience", "Overall experience"],
] as const;

type ServiceField = typeof SERVICE_FIELDS[number][0];
type ServiceRatings = Record<ServiceField, number>;
type Review = { id: string; rating: number; body: string; createdAt: string; user?: { displayName: string; username: string; avatarUrl?: string | null }; serviceRating?: Partial<ServiceRatings> | null };
type Props = { restaurantId: string };

const initialRatings = (): ServiceRatings => Object.fromEntries(SERVICE_FIELDS.map(([field]) => [field, 4])) as ServiceRatings;

function Stars({ value, onChange, readOnly = false }: { value: number; onChange?: (value: number) => void; readOnly?: boolean }) {
  return (
    <span className="service-rating-stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => readOnly ? <span key={star} aria-hidden="true">{star <= value ? "★" : "☆"}</span> : <button key={star} type="button" aria-label={`Rate ${star} out of 5`} onClick={() => onChange?.(star)}>{star <= value ? "★" : "☆"}</button>)}
    </span>
  );
}

function average(values: Array<number | null | undefined>) {
  const usable = values.filter((value): value is number => typeof value === "number");
  return usable.length ? (usable.reduce((sum, value) => sum + value, 0) / usable.length).toFixed(1) : "—";
}

export function RestaurantReviews({ restaurantId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [serviceRatings, setServiceRatings] = useState<ServiceRatings>(initialRatings);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadReviews() {
    setLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, { cache: "no-store" });
      const data = await response.json() as { reviews?: Review[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load reviews.");
      setReviews(data.reviews ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadReviews(); }, [restaurantId]);

  const serviceSummary = useMemo(() => Object.fromEntries(SERVICE_FIELDS.map(([field]) => [field, average(reviews.map((review) => review.serviceRating?.[field]))])) as Record<ServiceField, string>, [reviews]);
  const overall = average(reviews.map((review) => review.rating));

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (body.trim().length < 10) { setError("Please share at least 10 characters about your experience."); return; }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body: body.trim(), serviceRatings }),
      });
      const data = await response.json() as { review?: Review; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to submit your review.");
      if (data.review) setReviews((current) => [data.review!, ...current]);
      setBody("");
      setRating(5);
      setServiceRatings(initialRatings());
      setMessage("Your review and service ratings were submitted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="restaurant-reviews" aria-labelledby="restaurant-reviews-heading">
      <div className="restaurant-reviews-heading"><div><span className="eyebrow">CUSTOMER FEEDBACK</span><h2 id="restaurant-reviews-heading">Reviews & service ratings</h2><p>See the overall restaurant rating separately from the details of the customer experience.</p></div>{reviews.length > 0 && <div className="restaurant-overall-rating"><strong>{overall}</strong><span>★</span><small>{reviews.length} review{reviews.length === 1 ? "" : "s"}</small></div>}</div>
      {reviews.some((review) => review.serviceRating) && <div className="service-summary" aria-label="Average service ratings">{SERVICE_FIELDS.map(([field, label]) => <div className="service-summary-row" key={field}><span>{label}</span><Stars value={Number(serviceSummary[field]) || 0} readOnly /><strong>{serviceSummary[field]}</strong></div>)}</div>}
      <form className="service-review-form" onSubmit={submitReview}>
        <div className="service-review-form-head"><div><h3>Share your experience</h3><p>Rate the restaurant overall, then tell us what stood out.</p></div><div><span>Overall restaurant rating</span><Stars value={rating} onChange={setRating} /></div></div>
        <div className="service-rating-grid">{SERVICE_FIELDS.map(([field, label]) => <label key={field}><span>{label}</span><Stars value={serviceRatings[field]} onChange={(value) => setServiceRatings((current) => ({ ...current, [field]: value }))} /></label>)}</div>
        <label className="service-review-body"><span>Your review</span><textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={10} maxLength={2000} placeholder="What did you enjoy? What could be improved?" /><small>{body.length}/2000</small></label>
        {error && <p className="service-review-message error" role="alert">{error}</p>}
        {message && <p className="service-review-message success" role="status">{message}</p>}
        <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit review"}</button>
      </form>
      <div className="review-list">{loading && <p className="review-empty">Loading reviews...</p>}{!loading && !reviews.length && <p className="review-empty">No reviews yet. Be the first customer to share an experience.</p>}{reviews.map((review) => <article className="public-review" key={review.id}><div className="public-review-top"><strong>{review.user?.displayName ?? "FoodBook customer"}</strong><Stars value={review.rating} readOnly /><time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</time></div><p>{review.body}</p>{review.serviceRating && <div className="public-review-services">{SERVICE_FIELDS.filter(([field]) => typeof review.serviceRating?.[field] === "number").map(([field, label]) => <span key={field}>{label}: {review.serviceRating?.[field]}/5</span>)}</div>}</article>)}</div>
    </section>
  );
}
