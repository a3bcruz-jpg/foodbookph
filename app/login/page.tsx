import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
	const params = await searchParams;
	return <AuthForm mode="login" audience={params.role === "owner" ? "owner" : "customer"} />;
}
