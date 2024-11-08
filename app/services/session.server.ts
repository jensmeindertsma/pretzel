import {
  createCookie,
  createCookieSessionStorage,
  redirect,
} from "@remix-run/node";
import { getEnviromentVariable } from "./environment.server";

const cookie = createCookie("pretzel", {
  httpOnly: true,
  path: "/",
  secrets: [getEnviromentVariable("SESSION_SECRET")],
});

const sessionStorage = createCookieSessionStorage({ cookie });

export async function getSession(
  request: Request,
): Promise<GuestSession | UserSession> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  const userId = session.get("user-id");

  if (!userId) {
    return {
      isAuthenticated: false,

      async authenticate({ userId, redirectTo }: AuthenticateOptions) {
        session.set("user-id", userId);

        return redirect(redirectTo, {
          headers: {
            "Set-Cookie": await sessionStorage.commitSession(session),
          },
        });
      },
    };
  } else {
    return {
      isAuthenticated: true,

      userId: userId as string,

      async end({ redirectTo }: EndOptions) {
        return redirect(redirectTo, {
          headers: {
            "Set-Cookie": await sessionStorage.destroySession(session),
          },
        });
      },
    };
  }
}

type GuestSession = {
  isAuthenticated: false;

  authenticate(options: AuthenticateOptions): Promise<Response>;
};

type UserSession = {
  isAuthenticated: true;
  userId: string;

  end(options: EndOptions): Promise<Response>;
};

type AuthenticateOptions = {
  userId: string;
  redirectTo: string;
};

type EndOptions = { redirectTo: string };
