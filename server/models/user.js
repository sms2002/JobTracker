const mongoose=require('mongoose')

const User=mongoose.model('User',{
    name:String,
    email:String,
    mobile:Number,
    password:String,
  })
  
module.exports=User