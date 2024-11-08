import { Form, json, redirect, useActionData } from "@remix-run/react";
import argon2 from "argon2";
import { z } from "zod";
import { database } from "~/services/database.server";
import { validateFields } from "~/services/form.server";
import { getSession } from "~/services/session.server";
import {
  ActionArguments,
  LoaderArguments,
  MetaArguments,
  MetaResult,
} from "~/types/remix";

export default function SignUp() {
  const feedback = useActionData<typeof action>();

  return (
    <>
      <h1>Sign Up</h1>
      <Form method="post">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          aria-invalid={Boolean(feedback?.name)}
        />
        <p aria-errormessage={feedback?.name ? "name" : undefined}>
          {feedback?.name}
        </p>

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

        <label htmlFor="password">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          aria-invalid={Boolean(feedback?.confirmPassword)}
        />
        <p
          aria-errormessage={
            feedback?.confirmPassword ? "confirmPassword" : undefined
          }
        >
          {feedback?.confirmPassword}
        </p>

        <button type="submit">Sign Up</button>
      </Form>
    </>
  );
}

export function meta({ error }: MetaArguments): MetaResult {
  return [{ title: error ? "Error!" : "Sign Up" }];
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
      name: z
        .string()
        .min(1, "Please provide a name")
        .max(50, "This name is too long"),
      email: z
        .string()
        .email()
        .refine(
          async (email) => {
            const existingUser = await database.user.findUnique({
              where: { email },
            });

            // Show the error if there is an existing user
            return existingUser ? false : true;
          },
          {
            message: "This email address is already in use",
          },
        ),
      password: z
        .string()
        .min(1, "Please provide a password")
        .max(64, "This password is too long")
        .refine((password) => /[a-z]/.test(password), {
          message: "Your password must contain at least 1 lowercase character",
        })
        .refine((password) => /[A-Z]/.test(password), {
          message: "Your password must contain at least 1 uppercase character",
        })
        .refine((password) => /[0-9]/.test(password), {
          message: "Your password must contain at least 1 number",
        })
        .refine(
          (password) =>
            SPECIAL_CHARACTERS.some((character) =>
              password.includes(character),
            ),
          {
            message: "Your password must contain at least 1 special character",
          },
        ),
      confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "This password does not match",
      path: ["confirmPassword"],
    });

  const [feedback, fields] = await validateFields(formData, schema);

  if (feedback) {
    return json(feedback);
  }

  const { name, email, password } = fields;

  const { id: userId } = await database.user.create({
    data: {
      name,
      email,
      password: {
        create: {
          hash: await argon2.hash(password),
        },
      },
    },
  });

  return await session.authenticate({ userId, redirectTo: "/overview" });
}

const SPECIAL_CHARACTERS = [
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "(",
  ")",
  "-",
  "_",
  "=",
  "+",
  "{",
  "}",
  "[",
  "]",
  ":",
  ";",
  "'",
  '"',
  "\\",
  "|",
  ",",
  "<",
  ">",
  ".",
  "?",
  "/",
  "`",
  "~",
];
