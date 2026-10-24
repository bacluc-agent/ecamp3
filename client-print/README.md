# Client print service

The service renders the same client-side PDF components as the frontend using the Node renderer. The frontend loads the print configuration's API relations with the logged-in session, serializes that state, and sends it to `POST /render`; the service returns the generated PDF. The JWT is not sent to the service because rendering uses the already-authorized API data loaded by the frontend.

Start the application with `docker compose up -d`. The service listens on port `3010`; set `VITE_CLIENT_PRINT_URL` to its browser-reachable URL when it is not `http://localhost:3010`. Set `CLIENT_PRINT_ALLOWED_ORIGIN` to the frontend origin if it differs from `http://localhost:3000`.

`POST /render` accepts `config`, `storeData`, and `translationData` from the existing print frontend. `GET /health` reports service availability.
