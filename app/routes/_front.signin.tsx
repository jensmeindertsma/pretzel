import { Form, json, redirect, useActionData } from "@remix-run/react";
import { z, ZodIssueCode } from "zod";
import argon2 from "argon2";
import { database } from "~/services/database.server";
import { validateFields } from "~/services/form.server";
import { getSession } from "~/services/session.server";
import {
  ActionArguments,
  LoaderArguments,
  MetaArguments,
  MetaResult,
} from "~/types/remix";

export default function SignIn() {
  const feedback = useActionData<typeof action>();

  return (
    <>
      <h1>Sign In</h1>
      <Form method="post">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          aria-invalid={Boolean(feedback?.email)}
        />
        <p aria-errormessage={feedback?.email ? "email" : undefined}>
          {feedback?.email}
        </p>

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          aria-invalid={Boolean(feedback?.password)}
        />
        <p aria-errormessage={feedback?.password ? "password" : undefined}>
          {feedback?.password}
        </p>

        <button type="submit">Sign In</button>
      </Form>
    </>
  );
}

export function meta({ error }: MetaArguments): MetaResult {
  return [{ title: error ? "Error!" : "Sign In" }];
}

export async function loader({ request }: LoaderArguments) {
  const session = await getSession(request);

  if (session.isAuthenticated) {
    return redirect("/overview");
  }

  return null;
}

export async function action({ request }: ActionArguments) {
  const session = await getSession(request);

  if (session.isAuthenticated) {
    return redirect("/overview");
  }

  const formData = await request.formData();

  const schema = z
    .object({
      email: z.string().min(1, "Please provide your email address"),
      password: z.string().min(1, "Please provide your password"),
    })
    .superRefine(async ({ email, password }, ctx) => {
      const user = await database.user.findUnique({
        where: { email },
        select: { password: { select: { hash: true } } },
      });

      if (!user) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["email"],
          message: "There is no user with this email address",
        });
        return;
      }

      if (!user.password) {
        throw new Error("Cannot authenticate user that has no password");
      }

      const valid = await argon2.verify(user.password?.hash, password);

      if (!valid) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["password"],
          message: "This password is wrong",
        });
      }
    });

  const [feedback, fields] = await validateFields(formData, schema);

  if (feedback) {
    return json(feedback);
  }

  const { email } = fields;

  const user = await database.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Sign in succeeded but failed to get user ID");
  }

  return await session.authenticate({
    userId: user.id,
    redirectTo: "/overview",
  });
}
