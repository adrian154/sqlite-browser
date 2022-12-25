// load databases
const Database = require("better-sqlite3");
const {auth, claimCheck} = require("express-openid-connect");
const fs = require("fs");
const config = require("./config.json");

const databases = {};
for(const file of fs.readdirSync("databases")) {
    databases[file] = new Database("databases/" + file);
}

const express = require("express");
const app = express();

app.use(auth(config.openidSettings));
app.use(claimCheck((req, claims) => config.allowedUsers.includes(claims.sub)));

app.use(express.static("static"));

app.get("/databases", (req, res) => res.json(Object.keys(databases)));

app.post("/exec", (req, res) => {
    
    if(!req.query.db || !databases[req.query.db]) {
        return res.status(404).json({error: "No database with that name exists"});
    }

    if(!req.query.query) {
        return res.status(400).json({error: "Invalid parameters"});
    }

    const db = databases[req.query.db];

    try {
        const stmt = db.prepare(req.query.query);
        if(stmt.reader) {
            res.json({data: stmt.all()});
        } else {
            res.json({changes: stmt.run().changes});
        }
    } catch(error) {
        if(error instanceof Database.SqliteError) {
            res.status(400).json({error: error.message, code: error.code});
        } else {
            res.status(500).json({error: error.message});
        }
    }

});

app.listen(80, () => console.log("Listening"));