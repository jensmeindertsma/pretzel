import { Link, Outlet } from "@remix-run/react";

export default function Front() {
  return (
    <>
      <header>
        <p>
          <Link to="/">Pretzel</Link>
        </p>
        <nav>
          <ul>
            <li>
              <Link to="/signin">Sign in</Link>
            </li>
            <li>
              <Link to="/signup">Sign up</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
