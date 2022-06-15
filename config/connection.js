const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    // const url='mongodb://localhost:27017'
    const url='mongodb+srv://arjunsv01:9048952580@cluster0.sxhfp.mongodb.net/Heel2toe-ShoeStore?retryWrites=true&w=majority'
    const dbname='Heel2toe-ShoeStore'

    mongoClient.connect(url,(err,data)=>{
        if(err)return done(err)
        state.db=data.db(dbname)
        done()
    })
}
module.exports.get=function(){
    return state.db
}

