import express from "express";
import serveIndex from "serve-index";

const app = express();

// Serve songs + allow directory listing
app.use('/songs', express.static('songs'), serveIndex('songs', { icons: true }));

// Serve your static HTML/JS/CSS for the frontend
app.use(express.static("."));

app.listen(3000, () => {
    console.log("Server running at http://127.0.0.1:3000");
});