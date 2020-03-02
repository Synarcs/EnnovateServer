const passport = require("passport");
// strategies
const facebook = require("passport-facebook");
const github = require("passport-github");
const google = require("passport-google-oauth20");

const firebase = require("firebase");

// for facebook
const addUserToFirebase = ({ id, displayName, provider }, imageUrl) => {
  // team leader is the first one
  firebase
    .firestore()
    .doc(`/${provider}/${displayName}`)
    .set({
      id,
      Team_Leader: displayName,
      provider,
      image: imageUrl
    })
    .then(msg => {
      console.log("user is added");
    })
    .catch(err => {
      console.log(err);
    });
};

const {
  developmentUrl,
  facebook: { clientID, clientSecret },
  github: { githubclientID, githubclientSecret },
  google: { googleId, googleSecret }
} = require("../configs/config");

// serialize the user for all
passport.serializeUser((user, done) => {
  // stuff in cookie
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log("get data now in cookie");
  done(null, user);
});

// facebook
passport.use(
  new facebook(
    {
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL: `/auth/facebook/callback`,
      profileFields: ["id", "displayName", "photos", "email"]
    },
    function(accessToken, refreshToken, profile, done) {
      console.log("facebook");
      console.log(profile);
      const { id, displayName, provider } = profile;
      addUserToFirebase({ id, displayName, provider }, profile.photos[0].value);
      return done(null, profile);
    }
  )
);

const addGithubUser = ({ id, username, profileUrl, provider }) => {
  firebase
    .firestore()
    .doc(`/${provider}/${username}`)
    .set({
      id,
      Team_Leader: username,
      provider,
      image: profileUrl,
      redirect_page: false
    })
    .then(msg => {
      console.log("user is added to github");
    })
    .catch(err => {
      console.log(err);
    });
  // data
  firebase
    .firestore()
    .doc(`/Ennovate2k20/${username}`)
    .update({
      id,
      Team_Leader: username,
      provider,
      image: profileUrl,
      redirect_page: false
    })
    .then(msg => {
      console.log("user is added to github");
    })
    .catch(err => {
      console.log(err);
    });
};

// github
passport.use(
  new github(
    {
      clientID: githubclientID,
      clientSecret: githubclientSecret,
      callbackURL: `/auth/github/callback`
    },
    function(accessToken, refreshToken, profile, done) {
      const { id, username, profileUrl, provider } = profile;
      addGithubUser({ id, username, profileUrl, provider });
      return done(null, profile);
    }
  )
);

const addGoogleUse = ({ id, displayName, name, provider }) => {
  // firebase
  // .firestore()
  // .doc(`/${provider}/${displayName}`)
  // .set({
  //   id,
  //   Team_Leader: displayName,
  //   details: name,
  //   provider
  // })
  // .then(msg => {
  //   console.log("user is added to github");
  // })
  // .catch(err => {
  //   console.log(err);
  // });
  //
  firebase
    .firestore()
    .doc(`/${provider}/${username}`)
    .set({
      id,
      Team_Leader: displayName,
      provider,
      details: name,
      image: profileUrl,
      redirect_page: false
    })
    .then(msg => {
      console.log("user is added to github");
    })
    .catch(err => {
      console.log(err);
    });
  // data
  firebase
    .firestore()
    .doc(`/Ennovate2k20/${username}`)
    .update({
      id,
      Team_Leader: username,
      provider,
      image: profileUrl,
      redirect_page: false
    })
    .then(msg => {
      console.log("user is added to github");
    })
    .catch(err => {
      console.log(err);
    });
};

// google
passport.use(
  new google(
    {
      clientID: googleId,
      clientSecret: googleSecret,
      callbackURL: `/auth/google/callback`,
      scope: ["profile"]
    },
    function(accessToken, refreshToken, profile, done) {
      const { id, displayName, name, provider } = profile;
      if (name) {
        addGoogleUse({ id, displayName, name, provider });
      }
      // no need to validate
      return done(null, profile);
    }
  )
);
