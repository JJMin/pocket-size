const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs");

/** Middleware:
 *  the body-parser library allows us to access POST request parameters, 
 *  such as req.body.longURL, which is stored in our URL database
 */
app.use(bodyParser.urlencoded({
  extended: true
}));

/** URL Database:
 *  contains all URLs that can be dynamically added or removed from the object 
 */
const urlDatabase = {
  "i3x0dj": "http://www.reddit.com",
  "w93jgp": "http://www.google.com"
}

/**
 *  a route that renders 'urls_index.ejs' (main page) which shows the URL database
 */
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

/**
 *  a route that redirects to main page that shows URL database
 */
app.get("/", (req, res) => {
  res.redirect('http://localhost:8080/urls/');
});

/**
 *  a route that renders 'urls_new.ejs' page that takes a long URL input from user
 */
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

/**
 *  a route that renders 'urls_show.ejs' page that shows the user the long and short URL
 */
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});

/**
 *  a route to handle shortURL requests that redirects user to its longURL
 */
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

/** 
 *  an additional endpoint (route) to a JSON format of our URL database
 */
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/** 
 *  a route that matches and handles the POST request when the user submits their long URL
 */
app.post("/urls", (req, res) => {
  let shortURL = shortURLGenerator();
  console.log(req.body, shortURL); // debug statement to see POST parameters
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('http://localhost:8080/urls/' + shortURL);
});

/**
 *  a route that handles the POST request to update an existing shortened URL
 */
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.changeURL;
  res.redirect('http://localhost:8080/urls/');
});

/**
 *  a route that handles the POST request to delete a specific URL from the URL database
 */
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('http://localhost:8080/urls/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/** shortURLGenerator function:
 *  a function that generates a short, randomized URL
 */
function shortURLGenerator() {
  var randomizedURL = "";
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    randomizedURL += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return randomizedURL;
}