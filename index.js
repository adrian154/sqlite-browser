// load databases
const Database = require("better-sqlite3");
const fs = require("fs");

const databases = {};
for(const file of fs.readdirSync("databases")) {
    databases[file] = new Database("databases/" + file);
}

const express = require("express");
const app = express();

app.use(express.static("static"));

app.get("/databases", (req, res) => res.json(Object.keys(databases)));

app.post("/:database/:table/exec", (req, res) => {
    
    const db = databases[req.params.database];
    if(!db) {
        return res.status(404).json({error: "No database with that name exists"});
    }

    if(!req.query.q) {
        return res.status(400).json({error: "Invalid parameters"});
    }

    try {
        const stmt = db.prepare(req.query.q);
        if(stmt.reader) {
            res.json(stmt.all());
        } else {
            res.json(stmt.run());
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