const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

/** Middleware:
 *  the cookie-parser library facilitates working with cookies
 */
app.use(cookieParser());

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
};

/** userDatabase:
 *  contains all the information of users that registered
 */
const userDatabase = {
  "vna83j": {
    id: "vna83j",
    email: "ericjaeminjoo@gmail.com",
    password: "noodle"
  },
  "q03jir": {
    id: "q03jir",
    email: "okxcar@gmail.com",
    password: "hotto_doggu"
  }
}

/**
 *  a route that renders 'urls_index.ejs' (main page) which shows the URL database
 */
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: req.cookies["user_id"]
  };
  res.render("urls_index", templateVars);
});

/**
 *  a route that redirects to main page that shows URL database
 */
app.get("/", (req, res) => {
  res.redirect('/urls');
});

/**
 *  a route that renders 'urls_new.ejs' page that takes a long URL input from user
 */
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: req.cookies["user_id"]
  };
  res.render("urls_new", templateVars);
});

/**
 *  a route that renders 'urls_show.ejs' page that shows the user the long and short URL
 */
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user: req.cookies["user_id"]
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

// TODO:
app.get("/register", (req, res) => {
  let templateVars = {
    user: req.cookies["user_id"]
  };
  res.render("urls_register", templateVars);
});

/** 
 *  a route that matches and handles the POST request when the user submits their long URL
 */
app.post("/urls", (req, res) => {
  let shortURL = randomStringGenerator();
  console.log(req.body, shortURL); // debug statement to see POST parameters
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls/' + shortURL);
});

/**
 *  a route that handles the POST request to update an existing shortened URL
 */
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.changeURL;
  res.redirect('/urls');
});

/**
 *  a route that handles the POST request to delete a specific URL from the URL database
 */
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

/**
 *  a route that handles the POST request for login to set a cookie 'user_id' to the value of
 *  the entire user object by looking it up in the userDatabase
 */
app.post("/login", (req, res) => {
  for (const user in userDatabase) {
    if (req.body.username == userDatabase[user].email) {
      res.cookie('user_id', userDatabase[user]);
    }
  }
  res.redirect('/urls');
});

/**
 *  a route that handles the POST request for logout to clear the 'username' cookie and redirects
 *  the user back to the main page ('/urls')
 */
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// TODO:
app.post("/register", (req, res) => {
  let user_id = randomStringGenerator();

  if (req.body.email == "" || req.body.password == "") {
    res.statusCode = 400;
    res.end('Do not leave input empty please.');
  } else {
    var emailExists = false;

    for (const user in userDatabase) {
      if (req.body.email == userDatabase[user].email) {
        emailExists = true;
        res.statusCode = 400;
        res.end('Email already exists!');
      } else if (!emailExists) {
        userDatabase[user_id] = {
          id: user_id,
          email: req.body.email,
          password: req.body.password
        };
        res.redirect('/urls');
        break;
      }
    }
  }
});

/**
 *  the program will not exit, it will create a web server, which will sit there listening for requests 
 *  on port 8080, allowing you to access any local path on 8080
 */
app.listen(PORT, () => {
  console.log(`Pocket-Size app is listening on port ${PORT}!`);
});

/** shortURLGenerator function:
 *  a function that generates a short, randomized URL
 */
function randomStringGenerator() {
  var randomizedString = "";
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    randomizedString += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return randomizedString;
}