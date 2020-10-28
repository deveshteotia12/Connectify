const express =require("express");
const bodyParser=require("body-parser");
const mongooes=require("mongoose");
const LocalStrategy = require('passport-local').Strategy
const ejs=require("ejs");
const fs=require('fs');
const path= require('path');
const fileUpload= require('express-fileupload');
const app=express();

app.use(fileUpload());
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");


const bcrypt=require("bcrypt");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname+'/public'));
app.set('view engine', 'ejs');

mongooes.connect("mongodb+srv://admin-devesh:Ravindra1@cluster0.2zvk2.mongodb.net/Best", {useNewUrlParser: true, useUnifiedTopology: true})
const mySchema=mongooes.Schema({
    Name: String,
    Email: String,
    Password: String,
    Search:[],
    Requests:[],
    Responses:[],
    Profile:[]
})
const myModel=mongooes.model("Search",mySchema);
/*app.get("/",function(req,res){
    res.render("Home");
})*/
app.use(flash());
app.use(session({
    secret: "itismylittlesecret",
    resave: false,
    saveUninitialized: false
}))
passport.use(new LocalStrategy({usernameField: 'email'},
    async function(email, password, cb) {
        myModel.findOne({ Email: email })
            .then((user) => {
                
                if (user == null) {
                    return cb(null, false, { message: 'No user with that email' })
                  }
                  bcrypt.compare(password, user.Password, function(err, result) {
                    // result == false
                    if(result)
                    {
                        return cb(null, user)
                    }
                    else{
                        return cb(null, false, { message: 'Password incorrect' })
                    }
                   });
               
            })
            .catch((err) => {   
                cb(err);
            });
}));
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});
passport.deserializeUser(function(id, cb) {
    myModel.findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});
app.use(passport.initialize())
app.use(passport.session());
app.use(methodOverride('_method'));
const route=require("./router1");
const { request } = require("http");

app.get("/",checkNotAuthenticated,function(req,res,next){
    res.render("Home");
})
app.get("/login",checkNotAuthenticated,function(req,res){
    res.render("login",{alert:""});
 })
app.get("/signup",checkNotAuthenticated,function(req,res){
     res.render("SignUp");
 })
app.get("/post",checkAuthenticated,function(req,res){
     res.render("Posts",{ID: req.user._id});
 })
app.get("/data",checkAuthenticated,function(req,res){
    
    myModel.find({},function(err,data){
        if(err)
        {
            res.redirect("/data");
        }
        else{
            if(data.length>0)
            {
                var list=[];
                data.forEach(function(e){
                   e.Search.forEach(function(a){
                       list.push(a);
                   })
                })
                res.render("index",{posts: list})
            }
            else{
                res.render("index",{posts: list})
            }
        }
    })
    
})
app.get("/response/:ID",function(req,res){
    res.send(req.params.ID);
    console.log(req.body);
})
app.post("/login",passport.authenticate('local',{
    successRedirect: "/data",
    failureRedirect: "/login",
    failureFlash: true
}))


app.get("/dashboard",function(req,res){
   
    myModel.findById(req.user._id,function(err,doc){
        if(err)
        {
            console.log(err);
        }
        else{
           var obj=doc.Profile[0];
           res.render("Dashboard",{Name: obj.name,specification: obj.specification,place: obj.place,posts: doc.Search,ID: req.user._id});
        }
    })
})
app.get("/dashboard/contact",function(req,res){
    myModel.findById(req.user._id,function(err,doc){
        if(err)
        {
            console.log(err);
        }
        else{
           var obj=doc.Profile[0];
           
           res.render("contactDashboard",{Name: obj.name,Email: obj.email,phone: obj.phone,specification: obj.specification,place: obj.place,ID: req.user._id});
        }
    })
   
})
app.get("/dashboard/Responses",function(req,res){
    myModel.findById(req.user._id,function(err,doc){
        if(err)
        {
            console.log(err);
        }
        else{
           var obj=doc.Profile[0];
           res.render("responseDashboard",{Name: obj.name,specification: obj.specification,place: obj.place,posts: doc.Responses,ID: req.user._id});
        }
    })
})
app.get("/profile/:ID",function(req,res){
    //console.log(req.params.ID);
    myModel.findById(req.params.ID,function(err,doc){
        if(err)
        {
            console.log(err);
        }
        else{
           var obj=doc.Profile[0];
           res.render("Profile",{Name: obj.name,specification: obj.specification,place: obj.place,posts: doc.Search,ID: req.params.ID});
        }
    })
})
app.get("/request",function(req,res){

    myModel.findById(req.user._id,function(err,doc){
          if(err)
          {
              console.log(err);
          }
          else{
              if(doc)
              {
                 var obj=doc.Profile[0];
                  res.render("requestDashboard",{Name: obj.name,specification: obj.specification,place: obj.place,posts: doc.Requests,ID: req.user._id})
              }
          }
    })
})
app.post("/dashboard/contact",function(req,res){
    
    var obj={
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        specification: req.body.specification,
        place: req.body.place
    }
    console.log(obj);
    myModel.findById(req.user._id,function(err,doc){
          if(err)
          {
              console.log(err);
          }
          else{
              doc.Profile.pop();
              doc.Profile.push(obj);
              doc.save().then(()=> res.redirect("/dashboard/contact"))
          }
    })
})

app.post("/signup",async (req,res)=>{
    try{
        const hashedPassword= await bcrypt.hash(req.body.password, 10)
        const object= new myModel({
         Name: req.body.Name,
         Email: req.body.email,
         Password: hashedPassword,
         Profile: [{
            name: req.body.Name,
            email: req.body.email,
            phone: "",
            specification: "",
            place: ""
         }]
       })
       object.save().then(()=>res.redirect("/login"));
    }
    catch
    {
        res.redirect('/signup');
    }
})
app.post("/post",function(req,res){
    
    var obj={
        Category: req.body.Category,
        Title: req.body.title,
        Information: req.body.info,
        Name: req.user.Name,
        ID: req.user._id,
        uniqueID: Date.now()
    }
    myModel.findOne({Email: req.user.Email},function(err,data){
        if(err)
        {
            res.redirect("/post");
        }
        else{
            if(data)
            {
                data.Search.push(obj);
                data.save().then(()=>res.redirect("/data"))
            }
        }
    })
})
app.post("/filter",function(req,res){
    var Filter=req.body.filter;
    myModel.find({},function(err,data){
        if(err)
        {
            console.log(err);
        }
        else{
            
            if(data.length>0)
            {
                var mainArray=[]
                data.forEach(function(e){
                    var temp=e.Search.filter(function(a){
                        return  a.Category.includes(Filter)
                    })
                    temp.forEach(function(a){
                        mainArray.push(a);
                    })
                })
                res.render("index",{posts: mainArray})
                 
            }
        }
    })
})
app.post("/data/request",function(req,res){
    var obj={
        Name: req.user.Name,
        email: req.body.email,
        phone: req.body.phone,
        Information: req.body.Information,
        questionID: req.body.questionID,
        userID: req.user._id
    }
    
    console.log(req.body.requestTo)
    myModel.findById(req.body.requestTo,function(err,doc){
        if(err)
        {
            console.log(err);
        }
        else{
            if(doc)
            {
                doc.Responses.push(obj);
                var d = new Date();
                var n = d.toLocaleDateString();
                function func(a)
                {
                    return a.uniqueID==req.body.questionID;
                }
               var y =doc.Search.find(func);
               console.log(y);
                var obj2={
                    Information: req.body.Information,
                    requestTo: req.body.requestTo,
                    questionID: req.body.questionID,
                    Status: {status: 'In Review',Message: ""},
                    Name: doc.Name,
                    Date: n,
                    QuestionDetail: y
                }
                myModel.findById(req.user._id,function(Err,data){
                      if(Err)
                      {
                          console.log(err);
                      }
                      else{
                          data.Requests.push(obj2);
                          data.save();
                         doc.save().then(()=>res.redirect("/data"));
                      }
                })
            }
        }
    })
})
app.post("/reject/:ID",function(req,res){
    console.log(req.params.ID)
    console.log(req.user._id)
    myModel.findOne({_id: req.params.ID},function(err,doc){
          if(err)
          {
              console.log(err)
          }
          else{
              if(doc)
              {
                  for(var i=0;i<doc.Requests.length;i++)
                  {
                      if(doc.Requests[i].questionID==req.body.quesID)
                      {
                          var obj=doc.Requests[i];
                          function myfunc(e)
                          {
                              return e.questionID!=req.body.quesID;
                          }
                          doc.Requests=doc.Requests.filter(myfunc);
                          obj.Status.Message=req.body.message;
                          obj.Status.status="Rejected";
                          doc.Requests.push(obj);
                          
                      }
                  }
               doc.save(()=>{ 
               myModel.findById(req.user._id,function(ERR,OBJ){
                    if(ERR)
                    {
                        console.log(ERR)
                    }
                    else{
                        function myFunc(e)
                        {
                            return e.questionID!=req.body.quesID;

                        }
                       OBJ.Responses= OBJ.Responses.filter(myFunc);
                       
                       OBJ.save().then(()=>res.redirect("/dashboard"));
                    }
                })
            }); 
              }
          }
    })
})

app.post("/accept/:ID",function(req,res){
    myModel.findById(req.params.ID,function(err,doc){
        if(err)
        {
            console.log(err)
        }
        else{
            if(doc)
            {
                for(var i=0;i<doc.Requests.length;i++)
                {
                    var obj=doc.Requests[i];
                          function myfunc(e)
                          {
                              return e.questionID!=req.body.quesID;
                          }
                          doc.Requests=doc.Requests.filter(myfunc);
                          obj.Status.Message=req.body.message;
                          obj.Status.status="ACCEPTED";
                          doc.Requests.push(obj);
                }
                doc.save().then(()=>res.redirect("/dashboard"));
                /*myModel.findById(req.user._id,function(ERR,OBJ){
                    if(ERR)
                    {
                        console.log(ERR)
                    }
                    else{
                        function myFunc(e)
                        {
                            return e.questionID!=req.body.quesID;

                        }
                       OBJ.Responses= OBJ.Responses.filter(myFunc)
                       OBJ.save().then(()=>res.redirect("/dashboard"))
                    }
                })*/
                
            }
        }
  })
})
app.get("/logout",function(req,res){
    req.logOut();
    res.redirect('/');
})
app.post("/temp",function(req,res){
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    var sampleFile = req.files.image;
     if( fs.existsSync(__dirname+"/public/uploads/"+req.user._id+".png"));
     {
        fs.unlink(__dirname+"/public/uploads/"+req.user._id+".png",function(err){
            if(err)
            {
                console.log(err);
            }else{
                console.log("Successfully deleted the file"); 
            }
        })
     }
      // Use the mv() method to place the file somewhere on your server
      sampleFile.mv(__dirname+"/public/uploads/"+req.user._id+".png", function(err) {
        if (err)
          return res.status(500).send(err);
    
        res.redirect('/dashboard/contact');
      });
})
app.post("/delete/:ID",function(req,res){
    myModel.findById(req.user._id,function(err,doc){
        if(err)
        {
            console.log(err)
        }
        else{
            if(doc)
            {
                function myfunc2(obj)
                {
                    return obj.questionID!=req.params.ID;
                }
                function myFunc(obj)
                {
                    return obj.uniqueID!=req.params.ID;
                }
                doc.Search = doc.Search.filter(myFunc)
                doc.Responses=doc.Responses.filter(myfunc2);
                
                doc.save(()=>{res.redirect("/dashboard")});
            }
        }
    })
})
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/');
}
function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated())
    {
        res.redirect("/data")
    }
    else{
        next();
    }
}
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);