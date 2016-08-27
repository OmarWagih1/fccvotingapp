var express = require('express');
var passport = require('passport');
var router = express.Router();
var url=require('url');
var body=require('body-parser');
var mongoose = require('mongoose');  
var votingschema=
mongoose.Schema({
  
    list: String,
    title: String,
    Votes: Array,
  
});
var user1 = false;

var Vote= mongoose.model('votes', votingschema);
router.get('/', function(req, res, next) {
  user1 = false;
  Vote.find({},{}).lean().exec(function(err,docs){
        if(err) console.log(err);
        res.render('index',{votes:docs, user:req.user, user1:user1});
      });
  
});
router.get('/mypolls', function(req, res, next) {
  user1= true;
  if(req.user.id)
  {
  Vote.find({list:req.user.id}).lean().exec(function(err,docs){
        if(err) console.log(err);
        res.render('index',{votes:docs, user:req.user, user1:user1});
      });
  }
  else
  {
    res.render('error');
  }
});
router.post('/addpoll', function(req,res){
  var title=req.body.title;
    var vot= req.body.votes.split('-');
    if(title==='' || vot[0] ==='')
    {
      res.redirect('/addpoll');
    }
    else {
   var qote=[];
    for(var i=0;i<vot.length;i++){
        qote.push([vot[i],0]);
    }
   Vote.collection.insert({list:req.user.id, title:title, Votes:qote});
   res.redirect('/');
    }
});
router.get('/polls/:id',function(req,res){
  var data = [];
  var daemon= req.url.split('/')[2];
      Vote.findById(daemon).lean().exec(function(err,docs){
        if(err) console.log(err);
        
        for(var i=0;i< docs.Votes.length;i++){
          data.push(([docs.Votes[i][0],docs.Votes[i][1]]));
        }
      
     console.log(data);
        res.render('vote',{votes:docs, user:req.user, dat:data});
        
      });
      
});
router.post('/polls/:id',function(req,res){
  var i = req.url.split('/')[2];
  if(req.body.Delete){
    Vote.find({ _id: i}).remove().exec(function(err,data){
      if(err) console.log(err);
      else{
        res.redirect('/mypolls');
      }
    });
  }
  else if(req.body.extraoption)
  {
   Vote.findById(i).lean().exec(function (err, role) {
    if(err) console.log(err);
    
        role.Votes.push([req.body.extraoption,1]);
        
        Vote.findOneAndUpdate({
          _id: role._id
        }, {
          $set: {
            Votes: role.Votes
          }
        }, {
          new: true
        },
        function(err, doc) {
          res.redirect('/polls/'+ role._id);
        }
);
      });
    
  }
  else{
 var choice=req.body.Values;
  Vote.findById(i).lean().exec(function (err, role) {
    if(err) console.log(err);
    for(var i=0;i<role.Votes.length;i++){

      if(role.Votes[i][0] === choice)
      {
        role.Votes[i][1]++;
        
        Vote.findOneAndUpdate({
          _id: role._id
        }, {
          $set: {
            Votes: role.Votes
          }
        }, {
          new: true
        },
        function(err, doc) {
          console.log(err || doc);
          console.log(req.session);
        }
);
      }
    }
  res.redirect('/polls/'+ role._id);
  });
  }
});

router.get('/login', function(req, res, next) {
  res.render('login.ejs', { message: req.flash('loginMessage') });
});

router.get('/signup', function(req, res) {
  res.render('signup.ejs', { message: req.flash('signupMessage') });
});

router.get('/profile', isLoggedIn, function(req, res) {
  res.render('profile.ejs', { user: req.user });
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});
router.get('/addpoll', function(req, res) {
  res.render('addpoll.ejs');
});




router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true,
}));

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
}));
router.get('/auth/twitter', passport.authenticate('twitter'));

router.get('/auth/twitter/callback', passport.authenticate('twitter', {  
  successRedirect: '/',
  failureRedirect: '/',
}));

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
      return next();
  res.redirect('/');
}