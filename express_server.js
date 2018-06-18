const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session')
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override')
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

app.use(express.static(__dirname + '/public'));

/** Middleware:
 *  the cookie-session library facilitates working with cookies
 */
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

/** Middleware:
 *  the body-parser library allows us to access POST request parameters, 
 *  such as req.body.longURL, which is stored in our URL database
 */
app.use(bodyParser.urlencoded({
  extended: true
}));

/** Middleware:
 * the connect-flash library is a special area of the session used for storing messages
 */
app.use(flash());

/** Middleware:
 *  the method-override library allows you to use HTTP verbs such as PUT or DELETE in places where
 *  the client does not support it (it will override with POST having ?_method=DELETE)
 */
app.use(methodOverride("_method"))

/** URL Database:
 *  contains all URLs that can be dynamically added or removed from the object 
 */
const urlDatabase = {
  "vna83j": {
    "i3x0dj": "http://www.reddit.com",
    "w93jgp": "http://www.youtube.com"
  },
  "q03jir": {
    "f02fjg": "http://www.netflix.com",
    "jg04jt": "http://www.facebook.com"
  }
};

/** userDatabase:
 *  contains all the information of users that registered
 */
const userDatabase = {
  "vna83j": {
    id: "vna83j",
    email: "ericjaeminjoo@gmail.com",
    password: "1"
  },
  "q03jir": {
    id: "q03jir",
    email: "okxcar@gmail.com",
    password: "1"
  }
}

/**
 *  a route that renders 'urls_index.ejs' (main page) which shows the URL database
 */
app.get("/urls", (req, res) => {
  let databaseObj = {
    urls: urlDatabase[req.session.user_id],
    user: req.session.user_id,
    username: req.session.user_username,
    messages: req.flash('error')
  };
  
  if (databaseObj.user) {
    res.render("urls_index", databaseObj);
  } else if (!databaseObj.user) {
    req.flash('error', 'Please login to have access.')
    res.redirect('/login');
  }
});

/**
 *  a route that redirects to main page that shows URL database
 */
app.get("/", (req, res) => {
  let databaseObj = {
    urls: urlDatabase[req.session.user_id],
    user: req.session.user_id,
    username: req.session.user_username,
    messages: req.flash('error')
  };

  if (databaseObj.user) {
    res.render("urls_index", databaseObj);
  } else if (!databaseObj.user) {
    req.flash('error', 'Please login to have access.')
    res.redirect('/login');
  }
});

/**
 *  a route that renders 'urls_new.ejs' page only for registered, logged in users that 
 *  takes a long URL input and shortens it
 */
app.get("/urls/new", (req, res) => {
  let databaseObj = {
    user: req.session.user_id,
    username: req.session.user_username,
    messages: req.flash('error')
  };

  if (databaseObj.user) {
    res.render("urls_new", databaseObj);
  } else if (!databaseObj.user) {
    req.flash('error', 'You must be registered and logged in to be able to shorten your long URL.')
    res.redirect('/urls');
  }
});

/**
 *  a route that renders 'urls_show.ejs' page that shows the user only their own shortened URLs
 */
app.get("/urls/:shortURL", (req, res) => {
  let databaseObj = {
    shortURL: req.params.shortURL,
    urls: urlDatabase[req.session.user_id],
    user: req.session.user_id,
    username: req.session.user_username,
    messages: req.flash('error')
  };
  let userFound = false;

  for (const user_id in urlDatabase) {
    if (user_id === databaseObj.user) {
      for (const shortURL in urlDatabase[user_id]) {
        if (shortURL === databaseObj.shortURL) {
          userFound = true;
          res.render("urls_show", databaseObj);
          break;
        }
      }
    }
  }

  if (!databaseObj.user) {
    req.flash('error', 'Please login to have access.')
    res.redirect('/login');
  }
  if (databaseObj.user && userFound === false) {
    req.flash('error', 'The URL you are trying to access does not belong to you.')
    res.redirect('/urls');
  }
});

/**
 *  a route to handle shortURL requests that redirects user to its longURL (all shortURLs are publicly accessible)
 */
app.get("/u/:shortURL", (req, res) => {
  let unknownURL = true;
  for (const user_id in urlDatabase) {
    for (const shortURL in urlDatabase[user_id]) {
      if (shortURL === req.params.shortURL) {
        unknownURL = false;
        res.redirect(urlDatabase[user_id][req.params.shortURL]);
        break;
      }
    }
  }
  if (unknownURL) {
    throw new Error("ERROR, URL does not exist.");
  }
});

/** 
 *  an additional endpoint (route) to a JSON format of our URL database
 */
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/**
 *  a route to handle the register request that renders the register page
 */
app.get("/register", (req, res) => {
  let databaseObj = {
    user: req.session.user_id,
    username: req.session.user_username,
    messages: req.flash('error')
  };
  res.render("urls_register", databaseObj);
});

/**
 *  a route to handle the login request that renders the login page
 */
app.get("/login", (req, res) => {
  let databaseObj = {
    user: req.session.user_id,
    username: req.session.user_username,
    messages: req.flash('error')
  };
  res.render("urls_login", databaseObj);
});

/** 
 *  a route that matches and handles the POST request when the user submits their long URL
 */
app.post("/urls", (req, res) => {
  let shortURL = randomStringGenerator();
  urlDatabase[req.session.user_id] = urlDatabase[req.session.user_id] || {};
  urlDatabase[req.session.user_id][shortURL] = req.body.longURL;
  res.redirect('/urls/' + shortURL);
});

/**
 *  a route that handles the POST request to update an existing shortened URL
 */
app.put("/urls/:shortURL", (req, res) => {
  urlDatabase[req.session.user_id][req.params.shortURL] = req.body.changeURL;
  res.redirect('/urls');
});

/**
 *  a route that handles the POST request to delete a specific URL from the URL database
 */
app.delete("/urls/:shortURL", (req, res) => {
  delete urlDatabase[req.session.user_id][req.params.shortURL];
  res.redirect('/urls');
});

/**
 *  a route that handles the POST request for login to set a cookie 'user_id' to the value of
 *  the user object id by looking it up in the userDatabase
 */
app.post("/login", (req, res) => {
  let userExists = false;

  for (const user in userDatabase) {
    if (req.body.username === userDatabase[user].email) {
      userExists = true;
      if (bcrypt.compareSync(req.body.password, userDatabase[user].password)) {
        req.session.user_id = userDatabase[user].id;
        req.session.user_username = userDatabase[user].email;
        res.redirect('/urls');
        break;
      } else {
        req.flash('error', 'Wrong credentials!')
        res.redirect('/login');
        break;
      }
    }
  }

  if (!userExists) {
    req.flash('error', 'That email does not exist.')
    res.redirect('/login');
  }
});

/**
 *  a route that handles the POST request for logout to clear the 'user_id' cookie and redirects
 *  the user back to the main page ('/urls')
 */
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

/**
 *  a route that handles the POST request for registration to allow people to register for a user account
 *  with an email and a password, then store the information into the user database
 */
app.post("/register", (req, res) => {
  let user_id = randomStringGenerator();
  let newUser = true;

  if (req.body.email === "" || req.body.password === "") {
    req.flash('error', 'Please do not leave input empty.')
    res.redirect('/register');
  } else {
    for (const user in userDatabase) {
      if (req.body.email === userDatabase[user].email) {
        newUser = false;
        req.flash('error', 'Email is already registered.')
        res.redirect('/register');
        break;
      }
    }
  }

  if (newUser) {
    userDatabase[user_id] = {
      id: user_id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    res.redirect('/login');
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
  let randomizedString = "";
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (let i = 0; i < 6; i++) {
    randomizedString += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return randomizedString;
}