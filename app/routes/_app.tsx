import { Form, Outlet } from "@remix-run/react";

export default function App() {
  return (
    <>
      <header>
        <p>Application</p>
        <Form method="post" action="/signout">
          <button type="submit">Sign Out</button>
        </Form>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
