// create a nextjs typescript logger library. The module has a const pino logger object, a children dictionary {}
// The module has 3 exposed functions:
// - static getLogger(name: string): logger
//   this static function returns a child logger from the module level pino logger object's .children method.

// import { testGenerateId } from "@/lib/uid-util";
import { NextRequest, NextResponse } from "next/server";

import pino from "pino";

import logger, { makeLogEntry } from "@/lib/logger";

// const reqObj2Test: Record<string, any> = {
//   object: "test",
//   nextUrl: {
//     href: "http://localhost:9002/dashboard",
//     origin: "http://localhost:9002",
//     protocol: "http:",
//     username: "",
//     password: "",
//     host: "localhost:9002",
//     hostname: "localhost",
//     port: "9002",
//     pathname: "/dashboard",
//     search: "",
//     hash: "",
//   },
//   url: "http://localhost:9002/dashboard",
//   bodyUsed: false,
//   cache: "default",
//   credentials: "same-origin",
//   destination: "",
//   headers: {
//     accept:
//       "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//     "accept-encoding": "gzip, deflate, br, zstd",
//     "accept-language": "en-US,en;q=0.9",
//     "cache-control": "max-age=0",
//     connection: "keep-alive",
//     cookie:
//       "flarum_remember=WRv5JvYfhT8UUHoYazkUYTdqCJWEQfDLus7bEGaU; user=ned.zhang@paracognition.ai; gmail-digest-user-session=Fe26.2*1*70f208872727b7120f75c88ae68b5f7dda4a9422bfb96693f01f38024739aaa6*xRwsoHbK4GSIpQneqw3ZeQ*4VAqbia1sM-8ojo2pc7us9HF1h4OkLjvfexmVjiU82Ht0bX5_BDjafNiUGQTdEB9-iAJW4dvS5Jjq3JY8c55rg*1749152172299*b5b9bc2f7a840f9a0c1ce77f6e8c28ec89ca7bbcd44137caf830e64e34f82b01*utiVxb86CrZEVdvcGzLMc0S9Ei7w39U28BBezfg8FNE~2; _ga=GA1.1.1131405157.1748028893; _ga_D4J355ELL1=GS2.1.s1748028892$o1$g1$t1748029143$j18$l0$h865213594$dWznl_sRai3l4R7-7OaZdDKeb4RCruW_qXQ; __next_hmr_refresh_hash__=48",
//     host: "localhost:9002",
//     referer: "http://localhost:9002/dashboard",
//     "sec-ch-ua":
//       '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": '"Windows"',
//     "sec-fetch-dest": "document",
//     "sec-fetch-mode": "navigate",
//     "sec-fetch-site": "same-origin",
//     "sec-fetch-user": "?1",
//     "upgrade-insecure-requests": "1",
//     "user-agent":
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0",
//     "x-forwarded-for": "::1",
//     "x-forwarded-host": "localhost:9002",
//     "x-forwarded-port": "9002",
//     "x-forwarded-proto": "http",

//     integrity: "",
//     keepalive: false,
//     method: "GET",
//     mode: "cors",
//     redirect: "follow",
//   },
// };

// const reqSerializer = (req: Record<string, any>) => {
//   console.warn("***** reqSerializer ***** is called!");
//   return { // Custom req serializer to avoid bearer token in the log
//     id: req.id,
//     method: req.method,
//     url: req.url,
//     query: req.query,
//     params: req.params,
//     remoteAddress: req.remoteAddress,
//     remotePort: req.remotePort,
//     headers: {
//       "content-type": req.headers["content-type"],
//       "user-agent": req.headers["user-agent"],
//       "accept": req.headers.accept,
//       // "postman-token": req.headers['postman-token'],
//       host: req.headers.host,
//       "accept-encoding": req.headers["accept-encoding"],
//       connection: req.connection,
//       "content-length": req.headers["content-length"],
//     },
//   };
// };

export async function GET(req: NextRequest) {
  // const applogger = pino(
  //     {
  //       level: "trace", // Set the minimum logging level to trace and let transports targets handle the level

  //       serializers: {
  //         "err": pino.stdSerializers.err,
  //         "req": reqSerializer,
  //         "res": pino.stdSerializers.res,
  //       },
  //     });

  console.log("**test-c** is called!", req.headers.get("x-request-id"));
  // const thisLogger = logger.child({ requestId: req.headers.get("x-request-id"),
  //   module: "aaa-test-c/route",
  //   function: "GET",
  //   "next-runtime": process.env.NEXT_RUNTIME,
  //  });

  // thisLogger.info({ req }, "**aaa-test-c** Request received - child logger" );

  logger.info(makeLogEntry(
    {
      time: Date.now(),
      module: "aaa-test-c/route",
      function: "GET",
      requestId: req.headers.get("x-request-id") || "",
    },
    req,
    "**aaa-test-c** Request received - root logger",
  ));

  return NextResponse.json({ logger: logger });
}
