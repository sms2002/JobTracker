const mongoose=require('mongoose')

const User=mongoose.model('User',{
    Name:String,
    Email:String,
    Mobile:Number,
    password:String,
  })
  
module.exports=User