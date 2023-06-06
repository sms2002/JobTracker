const mongoose=require('mongoose')

const Skill=mongoose.model('Skill',{
    skills:[String]
  })
  
module.exports=Skill