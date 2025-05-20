// // lib/withSession.ts
// import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
// import { sessionOptions } from "./session";
// import type { NextApiHandler, GetServerSidePropsContext } from "next";

// export function withSessionRoute(handler: NextApiHandler) {
//   return withIronSessionApiRoute(handler, sessionOptions);
// }

// export function withSessionSsr<P extends Record<string, unknown> = any>(
//   handler: (ctx: GetServerSidePropsContext) => Promise<{ props: P }>
// ) {
//   return withIronSessionSsr(handler, sessionOptions);
// }
