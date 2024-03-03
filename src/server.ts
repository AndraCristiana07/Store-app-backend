import express from "express";
import cors from "cors";
import { mock_products, mock_users } from "./data";
import jwt from "jsonwebtoken";
import audit from 'express-requests-logger'
import sqlite3, { } from 'sqlite3';
import {Database, open } from 'sqlite';


let db:Database;
(async () => {
    // open the database
    db = await open({
      filename: './database.db',
      driver: sqlite3.Database
    })

    await db.exec(`CREATE TABLE IF NOT EXISTS PRODUCTS (
        id INTEGER PRIMARY KEY,
        title TEXT,
        type TEXT,
        description TEXT,
        filename TEXT,
        height INTEGER,
        width INTEGER,
        price REAL,
        rating INTEGER
    )
    `);
    for(let product of mock_products){
        await db.run(`INSERT OR REPLACE INTO PRODUCTS (id, title, type, description, filename, height, width, price, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            product.id,
            product.title,
            product.type,
            product.description,
            product.filename,
            product.height,
            product.width,
            product.price,
            product.rating
        ]);
        }
    
    await db.exec(`CREATE TABLE IF NOT EXISTS USERS (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT,
        password TEXT
        )

    `);	
    for(let user of mock_users){
        await db.run(`INSERT OR REPLACE INTO USERS (id, name, email, password)
        VALUES (?, ?, ?, ?)`,
        [
            user.id,
            user.name,
            user.email,
            user.password
        ]);
        }

})();


const app = express();
app.use(audit());
app.use(express.json());
app.use(cors({
    credentials:true,
    origin:["http://localhost:4200"]
}));

app.get("/api/products",  async (req, res) => {
    // res.send(mock_products);
    const products = await db.all('SELECT * FROM PRODUCTS');
    // console.log(products);
    res.send(products);

})

app.get("/api/products/types", async (req, res) => {
    const types = await db.all('SELECT DISTINCT type FROM PRODUCTS');
    // const types = mock_products.map(p => p.type);
    // res.send(Array.from(new Set(types)));
    // console.log(types)
    res.send(types.map(t => t.type));
})

app.get("/api/products/:id", async (req, res) => {
    // const id = req.params.id;
    // const product = mock_products.find(p => p.id == id);
    // res.send(product);
    const product = await db.get('SELECT * FROM PRODUCTS WHERE id = ?', [req.params.id]);	
    console.log(product);
    res.send(product);
})
    

app.get("/api/products/types/:type", async (req, res) => {
    // const type = req.params.type;
    // const products = mock_products.filter(p => 
    //     p.type.toLowerCase().includes(type.toLowerCase()));
    // res.send(products);
    const type = await db.all('SELECT * FROM PRODUCTS WHERE type = ?', [req.params.type]);
    // console.log(type);
    res.send(type);

})



app.get("/api/products/search/:searchTerm", async (req,res) => {
    // const searchTerm = req.params.searchTerm;
    // const products = mock_products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const products = await db.all('SELECT * FROM PRODUCTS WHERE title LIKE ?', [`%${req.params.searchTerm}%`]);	
    res.send(products);

})

app.post("/api/users/login", async (req,res) => {
    const {email, password} = req.body;
    const user = await db.get('SELECT * FROM USERS WHERE email = ? AND password = ?', [email, password]);	
    // const user = mock_users.find(user => user.email === email && user.password === password);
    console.log(user);
    if(user){
        res.send(generateTokenResponse(user));
    }
    else{
        res.status(400).send("Invalid credentials");
    }
})

const generateTokenResponse = (user:any) => {
    const token = jwt.sign({
        email: user.email
    },  "secret", {	
        expiresIn: "30d"
    });

    user.token = token;
    return {'token' : token};
}

const port = 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})