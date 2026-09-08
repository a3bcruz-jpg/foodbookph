import Link from "next/link";
import { notFound } from "next/navigation";
import { getRestaurant } from "@/lib/content-repository";

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);
  if (!restaurant) notFound();

  const menus = "menus" in restaurant ? restaurant.menus : [];
  const location = "address" in restaurant ? `${restaurant.address}, ${restaurant.city}` : restaurant.location;
  return (
    <main className="restaurant-page">
      <header className="restaurant-page-header">
        <Link href="/" className="restaurant-page-back">FoodBookPH</Link>
        <span className="eyebrow">RESTAURANT PROFILE</span>
        <h1>{restaurant.name}</h1>
        <p>{restaurant.cuisine} <span>·</span> {location}</p>
      </header>
      <section className="public-menu" aria-labelledby="menu-heading">
        <div className="public-menu-heading">
          <div>
            <span className="eyebrow">FROM THE KITCHEN</span>
            <h2 id="menu-heading">Menu</h2>
          </div>
          {!menus.length && <p>Menu details are coming soon.</p>}
        </div>
        {menus.map((category) => (
          <section className="public-menu-category" key={category.id}>
            <div>
              <h3>{category.name}</h3>
              {category.description && <p>{category.description}</p>}
            </div>
            <div className="public-menu-items">
              {category.items.map((item) => (
                <article className="public-menu-item" key={item.id}>
                  {item.imageUrl && (
                    <img className="public-menu-item-image" src={item.imageUrl} alt={item.name} loading="lazy" />
                  )}
                  <div className="public-menu-item-copy">
                    <h4>{item.name}</h4>
                    {item.description && <p>{item.description}</p>}
                  </div>
                  {item.price !== null && <strong>₱{Number(item.price).toLocaleString("en-PH")}</strong>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
