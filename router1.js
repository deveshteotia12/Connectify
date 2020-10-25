const express=require("express")
const router=express.Router()


router.get("/",function(req,res,next){
    res.render("Home");
})
router.get("/login",function(req,res){
    res.render("login",{alert:""});
 })
router.get("/signup",function(req,res){
     res.render("SignUp");
 })
router.get("/post",function(req,res){
     res.render("Posts");
 })
 
module.exports=router;