/*
  GAME ROOM SERVICE WORKER
  ------------------------
  Network-first update strategy.

  - Always tries to load the newest files
  - Uses cache when offline
  - Activates updated service workers immediately
  - Deletes old Game Room caches
  - Avoids stale browser HTTP cache responses
*/

const CACHE = "game-room-runtime-v2";


/*
  Files required for the app to work offline.
  Add Scrabble files here when we build Scrabble.
*/

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


/* =========================================
   INSTALL
========================================= */

self.addEventListener(
  "install",
  event => {

    /*
      Don't leave the new service worker
      waiting for the old one to disappear.
    */

    self.skipWaiting();


    event.waitUntil(
      caches
        .open(CACHE)
        .then(async cache => {

          /*
            Cache files individually.

            This means one missing optional
            file won't cause the entire
            service worker installation
            to fail.
          */

          await Promise.allSettled(
            CORE_FILES.map(file =>
              cache.add(
                new Request(
                  file,
                  {
                    cache: "reload"
                  }
                )
              )
            )
          );

        })
    );
  }
);


/* =========================================
   ACTIVATE
========================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(
      (async () => {

        /*
          Delete old Game Room caches.
        */

        const keys =
          await caches.keys();


        await Promise.all(
          keys
            .filter(
              key =>
                key.startsWith(
                  "game-room-"
                ) &&
                key !== CACHE
            )
            .map(
              key =>
                caches.delete(key)
            )
        );


        /*
          Immediately control existing
          Game Room windows/PWA instances.
        */

        await self.clients.claim();

      })()
    );
  }
);


/* =========================================
   MESSAGE HANDLER
========================================= */

self.addEventListener(
  "message",
  event => {

    /*
      app.js can send this message when
      it discovers a waiting update.
    */

    if (
      event.data?.type ===
      "SKIP_WAITING"
    ) {

      self.skipWaiting();

    }
  }
);


/* =========================================
   FETCH
========================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    /*
      Only handle GET requests.

      Firebase/API POST requests etc.
      should pass through normally.
    */

    if (
      request.method !== "GET"
    ) {
      return;
    }


    const requestURL =
      new URL(request.url);


    /*
      Don't interfere with Firebase,
      Google APIs or other third-party
      resources.

      Only cache files belonging to
      Game Room itself.
    */

    if (
      requestURL.origin !==
      self.location.origin
    ) {
      return;
    }


    /* =====================================
       PAGE NAVIGATION

       index.html is NETWORK FIRST.
    ===================================== */

    if (
      request.mode === "navigate"
    ) {

      event.respondWith(
        (async () => {

          try {

            /*
              cache: "no-store"

              This is important.

              It tells the browser not to
              satisfy this request from its
              normal HTTP cache.

              We want the actual server.
            */

            const response =
              await fetch(
                request,
                {
                  cache: "no-store"
                }
              );


            if (
              response &&
              response.ok
            ) {

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

            }


            return response;

          }

          catch (error) {

            /*
              No internet?

              Open the most recently cached
              Game Room page.
            */

            const cached =
              await caches.match(
                "./index.html"
              );


            if (cached) {
              return cached;
            }


            return Response.error();

          }

        })()
      );


      return;
    }


    /* =====================================
       APP FILES

       JavaScript
       CSS
       JSON
       images
       fonts
       etc.

       NETWORK FIRST.
    ===================================== */

    event.respondWith(
      (async () => {

        try {

          /*
            Again bypass the browser's
            ordinary HTTP cache.

            We want the newest server
            response whenever online.
          */

          const response =
            await fetch(
              request,
              {
                cache: "no-store"
              }
            );


          /*
            Only save successful responses.
          */

          if (
            response &&
            response.ok
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

        }

        catch (error) {

          /*
            Network unavailable.

            Try the exact cached request
            first.
          */

          const cached =
            await caches.match(
              request
            );


          if (cached) {
            return cached;
          }


          /*
            Query-string fallback.

            Example:

            app.js?v=1.5.1

            If we're offline but previously
            only cached app.js, try matching
            while ignoring the query string.
          */

          const cachedWithoutQuery =
            await caches.match(
              request,
              {
                ignoreSearch: true
              }
            );


          if (
            cachedWithoutQuery
          ) {
            return cachedWithoutQuery;
          }


          return Response.error();

        }

      })()
    );
  }
);
