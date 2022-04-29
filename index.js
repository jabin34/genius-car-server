const  express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 4000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//middleware
app.use(cors());
app.use(express.json());
function verifyJWT(req,res,next){
    const authHead = req.headers.authorization;
    if(!authHead){
        return res.status(401).send({message:'unauthorized access'});
    }
    const token = authHead.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error, decoded)=>{
      if(error){
          return res.status(403).send({message:'Forbidden access'})
      } 
      console.log('decoded',decoded);
      req.decoded = decoded;
      next();
    })
    console.log('inside verifyJWT',authHead);
   
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ynswk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){

    try{
     await client.connect();
     const serviceCollection = client.db('geniusCar').collection('service');
     const orderCollection = client.db('geniusCar').collection('order');
//Auth
app.post('/login',async(req,res)=>{
    const user = req.body;
    const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
     expiresIn:'1d'   
    });
    res.send({accessToken});
})

     app.get('/service',async(req,res)=>{
        const query = {};
        const cursor = serviceCollection.find(query);    
        const services = await cursor.toArray();
        res.send(services);
     });
     app.get('/service/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const service = await serviceCollection.findOne(query);
      res.send(service);
     });
     //post
     app.post('/service',async(req,res)=>{
        const newSrvice =  req.body;
        const result = await serviceCollection.insertOne(newSrvice);
        res.send(result);
     });
     //Delete
     app.delete('/service/:id',async(req,res)=>{
         const id  = req.params.id;
         const query = {_id:ObjectId(id)};
         const result = await serviceCollection.deleteOne(query);
         res.send(result);
     });

     //get order details
app.get('/order',verifyJWT ,async(req,res)=>{
    const decodedEmail =  req.decoded.email;
    const email = req.query.email;
    if(email === decodedEmail){
        const query = {email:email};
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
    }
    else{
        res.status(403).send({message:'Forbidden'})
    }
    
   
})

   //order collecction api

   app.post('/order',async(req,res)=>{
   const order = req.body;
   const result = await orderCollection.insertOne(order);
   res.send(result);
   });


    }
    finally{
        console.log('done')
    }
}
run().catch(console.dir);
app.get('/',(req,res)=>{
    res.send('server is running');
 });
app.listen(port,()=>{
    console.log(' genius server running');
});