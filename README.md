This is a placeholder README.md2 file added so the workspace matches the provided manifest.

If you intended a different content or filename, update or remove this file.

## Media Folder

This project uses a `media/` folder in the root directory to store video files for local streaming.  

**Important Notes:**
- The folder **must exist** for the backend to serve videos correctly.
- You can place your `.mp4` files here, or leave it empty — we include a `.gitkeep` file so GitHub will track the folder even when empty.
- Example usage: `media/The Long Walk.mp4` can be streamed locally through the app.

> ⚠️ Do **not** commit large video files to GitHub. Keep the folder in your project, but store videos locally or use your own file paths.


### Running the App with Local Media

1. Place your `.mp4` files in the `media/` folder.
2. Make sure your backend is running (default: `http://localhost:3000`).
3. Access your videos through the app's frontend at `http://localhost:5173`.
