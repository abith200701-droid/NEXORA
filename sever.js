const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();

const PORT = 3000;

app.use(express.json());

app.use(express.static("."));

const db = new sqlite3.Database("sourcetrace.db");


db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        distance REAL NOT NULL,
        fuel TEXT NOT NULL,
        certificate TEXT NOT NULL,
        emissions REAL NOT NULL,
        status TEXT NOT NULL
    )
`);


app.post("/api/suppliers", (req, res) => {

    const {
        name,
        distance,
        fuel,
        certificate
    } = req.body;


    const factors = {
        diesel: 0.27,
        petrol: 0.25,
        electric: 0.05
    };


    const emissions =
        Number(distance) * factors[fuel];


    let status;


    if (certificate === "expired") {

        status = "NON-COMPLIANT";

    } 
    else if (emissions > 100) {

        status = "HIGH RISK";

    } 
    else {

        status = "COMPLIANT";

    }


    db.run(
        `
        INSERT INTO suppliers
        (name, distance, fuel, certificate, emissions, status)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            name,
            distance,
            fuel,
            certificate,
            emissions,
            status
        ],
        function(error) {

            if (error) {

                return res.status(500).json({
                    error: error.message
                });

            }


            res.json({

                id: this.lastID,

                name: name,

                distance: distance,

                fuel: fuel,

                certificate: certificate,

                emissions: emissions,

                status: status

            });

        }
    );
});


app.get("/api/suppliers", (req, res) => {

    db.all(
        "SELECT * FROM suppliers ORDER BY id DESC",
        [],
        (error, rows) => {

            if (error) {

                return res.status(500).json({
                    error: error.message
                });

            }

            res.json(rows);

        }
    );

});


app.listen(PORT, () => {

    console.log(
        `SourceTrace running at http://localhost:${PORT}`
    );

});