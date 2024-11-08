import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { database } from "~/services/database.server";
import { getSession } from "~/services/session.server";
import { LoaderArguments } from "~/types/remix";

export default function Overview() {
  const { name } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>Overview</h1>
      <p>Welcome, {name}</p>
    </>
  );
}

export async function loader({ request }: LoaderArguments) {
  const session = await getSession(request);

  if (!session.isAuthenticated) {
    return redirect("/signin");
  }

  const user = await database.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });

  if (!user) {
    throw new Error("Failed to retrieve user data");
  }

  return json({ name: user.name });
}
