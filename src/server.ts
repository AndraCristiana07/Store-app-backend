import express from "express";
import cors from "cors";
import { mock_products, mock_users } from "./data";
import jwt from "jsonwebtoken";


const app = express();
app.use(express.json());
app.use(cors({
    credentials:true,
    origin:["http://localhost:4200"]
}));

app.get("/api/products", (req, res) => {
    res.send(mock_products);
})

app.get("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = mock_products.find(p => p.id == id);
    res.send(product);
})
    
app.get("api/products/types/:type", (req, res) => {
    const type = req.params.type;
    const products = mock_products.filter(p => p.type.toLowerCase().includes(type.toLowerCase()));
    res.send(products);
})


app.get("/api/products/search/:searchTerm", (req,res) => {
    const searchTerm = req.params.searchTerm;
    const products = mock_products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    res.send(products);

})

app.post("/api/users/login", (req,res) => {
    const {email, password} = req.body;
    const user = mock_users.find(user => user.email === email && user.password === password);

    if(user){
        res.send(generateTokemResponse(user));
    }
    else{
        res.status(400).send("Invalid credentials");
    }
})

const generateTokemResponse = (user:any) => {
    const token = jwt.sign({
        email: user.email
    },  "secret", {	
        expiresIn: "30d"
    });

    user.token = token;
    return user;
}

const port = 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})