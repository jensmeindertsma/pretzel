import { redirect } from "@remix-run/node";
import { getSession } from "~/services/session.server";
import { LoaderArguments } from "~/types/remix";

export async function loader({ request }: LoaderArguments) {
  const session = await getSession(request);

  if (session.isAuthenticated) {
    return redirect("/overview");
  }

  return redirect("/");
}

export async function action({ request }: LoaderArguments) {
  const session = await getSession(request);

  return session.end({ redirectTo: "/" });
}
