/*
  GAME ROOM SERVICE WORKER

  Goals:
  - Check the network first for fresh files
  - Keep an offline fallback
  - Immediately activate new service workers
  - Remove old caches automatically
*/

const CACHE = "game-room-runtime-v1";

const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",

  "./core/config.js",
  "./core/firebase.js",
  "./core/games.js",

  "./core/property.js",
  "./core/property-game.js",

  "./manifest.json"
];


/* -----------------------------
   INSTALL
----------------------------- */

self.addEventListener(
  "install",
  event => {

    self.skipWaiting();

    event.waitUntil(
      caches
        .open(CACHE)
        .then(cache =>
          cache.addAll(CORE_FILES)
        )
    );
  }
);


/* -----------------------------
   ACTIVATE
----------------------------- */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(
      caches
        .keys()
        .then(keys =>
          Promise.all(
            keys
              .filter(
                key =>
                  key !== CACHE
              )
              .map(
                key =>
                  caches.delete(key)
              )
          )
        )
        .then(() =>
          self.clients.claim()
        )
    );
  }
);


/* -----------------------------
   ALLOW APP TO FORCE UPDATE
----------------------------- */

self.addEventListener(
  "message",
  event => {

    if (
      event.data?.type ===
      "SKIP_WAITING"
    ) {
      self.skipWaiting();
    }
  }
);


/* -----------------------------
   FETCH
----------------------------- */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;

    if (
      request.method !== "GET"
    ) {
      return;
    }


    /*
      PAGE NAVIGATION

      Always try the newest
      index.html first.
    */

    if (
      request.mode === "navigate"
    ) {

      event.respondWith(
        fetch(request)
          .then(response => {

            const copy =
              response.clone();

            event.waitUntil(
              caches
                .open(CACHE)
                .then(cache =>
                  cache.put(
                    "./index.html",
                    copy
                  )
                )
            );

            return response;
          })
          .catch(() =>
            caches.match(
              "./index.html"
            )
          )
      );

      return;
    }


    /*
      JS / CSS / JSON / OTHER FILES

      Network first.

      Therefore a deployed update
      is used immediately whenever
      internet is available.

      Cache is only the fallback.
    */

    event.respondWith(
      fetch(request)
        .then(response => {

          if (
            !response ||
            response.status !== 200
          ) {
            return response;
          }

          /*
            Don't attempt to cache
            third-party requests.
          */

          const requestURL =
            new URL(request.url);

          if (
            requestURL.origin ===
            self.location.origin
          ) {

            const copy =
              response.clone();

            event.waitUntil(
              caches
                .open(CACHE)
                .then(cache =>
                  cache.put(
                    request,
                    copy
                  )
                )
            );
          }

          return response;
        })

        .catch(async () => {

          const cached =
            await caches.match(
              request
            );

          if (cached) {
            return cached;
          }

          /*
            Navigation fallback,
            just in case.
          */

          if (
            request.destination ===
            "document"
          ) {
            return caches.match(
              "./index.html"
            );
          }

          return Response.error();
        })
    );
  }
);
