Solar City marker movement update v4

Copy files:
1) page.tsx -> your current map page.tsx
2) page.css -> your current map page.css
3) app/api/map-markers/route.ts -> C:\Users\lianc\Desktop\wtlo-wiki-project\app\api\map-markers\route.ts
4) public/db-assets/map-markers.json -> C:\Users\lianc\Desktop\wtlo-wiki-project\public\db-assets\map-markers.json

How it works:
- Drag any marker directly on the map to move it.
- Click a marker without dragging to open/close its information card.
- Marker coordinates auto-save through /api/map-markers.
- The saved file is public/db-assets/map-markers.json in the project, not browser localStorage.
- Visibility menu and creator panel UI layout can still use localStorage, but marker positions/data do not.

Important:
- Restart npm run dev after adding the API route.
- In local development, the JSON file updates on disk automatically.
- On Vercel/Netlify production, server files are usually read-only/ephemeral. For permanent production saving, use a database or a Git-backed/admin-save flow.
